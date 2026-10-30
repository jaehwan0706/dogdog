package com.dangsanchaek.moderation.dto;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserRole;
import com.dangsanchaek.auth.domain.UserStatus;
import com.dangsanchaek.moderation.domain.Report;
import com.dangsanchaek.moderation.domain.ReportReason;
import com.dangsanchaek.moderation.domain.ReportStatus;
import com.dangsanchaek.moderation.domain.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * 신고·차단·관리자 운영 API 요청·응답 DTO 모음.
 */
public final class ModerationDtos {

    private ModerationDtos() {
    }

    // ===================== 사용자: 신고 =====================

    public record ReportCreateRequest(
            @NotNull(message = "신고 대상 종류를 선택해 주세요. (POST, COMMENT, USER)") ReportTargetType targetType,
            @NotNull(message = "신고 대상이 필요합니다.") Long targetId,
            @NotNull(message = "신고 사유를 선택해 주세요.") ReportReason reason,
            @Size(max = 500, message = "상세 사유는 500자 이하여야 합니다.") String detail
    ) {
    }

    public record ReportResponse(Long id, ReportTargetType targetType, Long targetId, ReportReason reason,
                                 ReportStatus status, LocalDateTime createdAt) {
        public static ReportResponse from(Report r) {
            return new ReportResponse(r.getId(), r.getTargetType(), r.getTargetId(), r.getReason(), r.getStatus(),
                    r.getCreatedAt());
        }
    }

    // ===================== 사용자: 차단 =====================

    public record BlockedUserResponse(Long userId, String nickname, String profileImageUrl, LocalDateTime blockedAt) {
    }

    // ===================== 관리자: 신고 처리 =====================

    public enum ReportAction {
        /** 게시글·댓글 숨김 (USER 신고에는 사용 불가) */
        HIDE,
        /** 대상 작성자(또는 신고된 사용자) 이용정지 */
        SUSPEND,
        /** 문제 없음 */
        DISMISS
    }

    public record ReportResolveRequest(
            @NotNull(message = "action 은 HIDE, SUSPEND, DISMISS 중 하나입니다.") ReportAction action,
            @Size(max = 500) String memo
    ) {
    }

    /**
     * 신고 대상 요약. 대상이 지워졌으면 exists=false.
     * preview: 게시글 제목/댓글 내용/사용자 닉네임, hidden: 관리자 숨김 여부, authorStatus: 작성자 계정 상태
     */
    public record ReportTarget(boolean exists, Long authorId, String authorNickname, UserStatus authorStatus,
                               String preview, boolean hidden, Long postId) {
        public static ReportTarget missing() {
            return new ReportTarget(false, null, null, null, null, false, null);
        }
    }

    public record AdminReportResponse(
            Long id,
            ReportTargetType targetType,
            Long targetId,
            ReportReason reason,
            String detail,
            ReportStatus status,
            Long reporterId,
            String reporterNickname,
            ReportTarget target,
            long targetReportCount,
            String adminMemo,
            LocalDateTime resolvedAt,
            LocalDateTime createdAt
    ) {
    }

    // ===================== 관리자: 회원·콘텐츠 =====================

    public record AdminUserResponse(Long id, String email, String nickname, AuthProvider provider, UserRole role,
                                    UserStatus status, LocalDateTime createdAt) {
        public static AdminUserResponse from(User u) {
            return new AdminUserResponse(u.getId(), u.getEmail(), u.getNickname(), u.getProvider(), u.getRole(),
                    u.getStatus(), u.getCreatedAt());
        }
    }

    public record UserStatusRequest(
            @NotNull(message = "status 는 ACTIVE 또는 SUSPENDED 입니다.") UserStatus status
    ) {
    }

    public record VisibilityRequest(@NotNull(message = "hidden 값이 필요합니다.") Boolean hidden) {
    }
}
