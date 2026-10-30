package com.dangsanchaek.moderation.controller;

import com.dangsanchaek.auth.domain.UserStatus;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.moderation.domain.ReportStatus;
import com.dangsanchaek.moderation.dto.ModerationDtos.AdminReportResponse;
import com.dangsanchaek.moderation.dto.ModerationDtos.AdminUserResponse;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportResolveRequest;
import com.dangsanchaek.moderation.dto.ModerationDtos.UserStatusRequest;
import com.dangsanchaek.moderation.dto.ModerationDtos.VisibilityRequest;
import com.dangsanchaek.moderation.service.ModerationService;
import com.dangsanchaek.moderation.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 관리자 신고 처리 · 회원 이용정지 · 게시글/댓글 숨김 (/admin/** 는 ADMIN 만 허용) */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminModerationController {

    private final ReportService reportService;
    private final ModerationService moderationService;

    @GetMapping("/reports")
    public PageResponse<AdminReportResponse> reports(@RequestParam(required = false) ReportStatus status,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return reportService.search(status, pageable(page, size));
    }

    /** 신고 처리: HIDE(숨김) | SUSPEND(작성자 이용정지) | DISMISS(문제 없음) */
    @PatchMapping("/reports/{reportId}")
    public AdminReportResponse resolve(@LoginUser Long adminId, @PathVariable Long reportId,
                                       @Valid @RequestBody ReportResolveRequest request) {
        return reportService.resolve(adminId, reportId, request);
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> users(@RequestParam(required = false) UserStatus status,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return moderationService.searchUsers(status, keyword, pageable(page, size));
    }

    /** 이용정지(SUSPENDED) / 해제(ACTIVE) */
    @PatchMapping("/users/{userId}/status")
    public AdminUserResponse changeUserStatus(@PathVariable Long userId, @Valid @RequestBody UserStatusRequest request) {
        return moderationService.changeUserStatus(userId, request.status());
    }

    @PatchMapping("/posts/{postId}/visibility")
    public ResponseEntity<Void> postVisibility(@PathVariable Long postId, @Valid @RequestBody VisibilityRequest request) {
        moderationService.setPostHidden(postId, request.hidden());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/comments/{commentId}/visibility")
    public ResponseEntity<Void> commentVisibility(@PathVariable Long commentId,
                                                  @Valid @RequestBody VisibilityRequest request) {
        moderationService.setCommentHidden(commentId, request.hidden());
        return ResponseEntity.noContent().build();
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Direction.DESC, "id"));
    }
}
