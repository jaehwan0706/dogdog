package com.dangsanchaek.moderation.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserStatus;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.community.repository.CommentRepository;
import com.dangsanchaek.community.repository.PostRepository;
import com.dangsanchaek.moderation.domain.Report;
import com.dangsanchaek.moderation.domain.ReportStatus;
import com.dangsanchaek.moderation.domain.ReportTargetType;
import com.dangsanchaek.moderation.dto.ModerationDtos.AdminReportResponse;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportCreateRequest;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportResolveRequest;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportResponse;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportTarget;
import com.dangsanchaek.moderation.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int PREVIEW_LENGTH = 80;

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final UserReader userReader;
    private final ModerationService moderationService;

    @Transactional
    public ReportResponse create(Long userId, ReportCreateRequest request) {
        userReader.getActiveUser(userId);
        ReportTarget target = findTarget(request.targetType(), request.targetId());
        if (!target.exists()) {
            throw new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND);
        }
        if (userId.equals(target.authorId())) {
            throw new BusinessException(ErrorCode.CANNOT_REPORT_SELF);
        }
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(userId, request.targetType(), request.targetId())) {
            throw new BusinessException(ErrorCode.ALREADY_REPORTED);
        }
        Report report = reportRepository.saveAndFlush(
                new Report(userId, request.targetType(), request.targetId(), request.reason(), blankToNull(request.detail())));
        return ReportResponse.from(report);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReportResponse> search(ReportStatus status, Pageable pageable) {
        return PageResponse.of(reportRepository.search(status, pageable), this::toAdminResponse);
    }

    /**
     * 신고 처리. 같은 대상의 다른 검토 대기 신고도 같은 결과로 함께 닫는다.
     */
    @Transactional
    public AdminReportResponse resolve(Long adminId, Long reportId, ReportResolveRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
        if (!report.isPending()) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_RESOLVED);
        }
        ReportTarget target = findTarget(report.getTargetType(), report.getTargetId());

        ReportStatus result = switch (request.action()) {
            case HIDE -> {
                if (!target.exists()) throw new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND);
                switch (report.getTargetType()) {
                    case POST -> moderationService.setPostHidden(report.getTargetId(), true);
                    case COMMENT -> moderationService.setCommentHidden(report.getTargetId(), true);
                    case USER -> throw new BusinessException(ErrorCode.INVALID_INPUT);
                }
                yield ReportStatus.ACTION_TAKEN;
            }
            case SUSPEND -> {
                if (!target.exists()) throw new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND);
                moderationService.changeUserStatus(target.authorId(), UserStatus.SUSPENDED);
                yield ReportStatus.ACTION_TAKEN;
            }
            case DISMISS -> ReportStatus.DISMISSED;
        };

        String memo = blankToNull(request.memo());
        for (Report pending : reportRepository.findByTargetTypeAndTargetIdAndStatus(
                report.getTargetType(), report.getTargetId(), ReportStatus.PENDING)) {
            pending.resolve(result, adminId, memo);
        }
        reportRepository.flush();
        return toAdminResponse(report);
    }

    private AdminReportResponse toAdminResponse(Report r) {
        String reporterNickname = userRepository.findById(r.getReporterId()).map(User::getNickname).orElse(null);
        return new AdminReportResponse(r.getId(), r.getTargetType(), r.getTargetId(), r.getReason(), r.getDetail(),
                r.getStatus(), r.getReporterId(), reporterNickname, findTarget(r.getTargetType(), r.getTargetId()),
                reportRepository.countByTargetTypeAndTargetId(r.getTargetType(), r.getTargetId()),
                r.getAdminMemo(), r.getResolvedAt(), r.getCreatedAt());
    }

    private ReportTarget findTarget(ReportTargetType type, Long targetId) {
        return switch (type) {
            case POST -> postRepository.findWithAuthorById(targetId)
                    .map(p -> new ReportTarget(true, p.getAuthor().getId(), p.getAuthor().getNickname(),
                            p.getAuthor().getStatus(), p.getTitle(), p.isHidden(), p.getId()))
                    .orElseGet(ReportTarget::missing);
            case COMMENT -> commentRepository.findById(targetId)
                    .filter(c -> !c.isDeleted())
                    .map(c -> new ReportTarget(true, c.getAuthor().getId(), c.getAuthor().getNickname(),
                            c.getAuthor().getStatus(), preview(c.getContent()), c.isHidden(), c.getPost().getId()))
                    .orElseGet(ReportTarget::missing);
            case USER -> userRepository.findById(targetId)
                    .filter(u -> u.getStatus() != UserStatus.DELETED)
                    .map(u -> new ReportTarget(true, u.getId(), u.getNickname(), u.getStatus(), u.getNickname(),
                            false, null))
                    .orElseGet(ReportTarget::missing);
        };
    }

    private static String preview(String content) {
        return content.length() > PREVIEW_LENGTH ? content.substring(0, PREVIEW_LENGTH) + "…" : content;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
