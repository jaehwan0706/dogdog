package com.dangsanchaek.moderation.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.moderation.dto.ModerationDtos.BlockedUserResponse;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportCreateRequest;
import com.dangsanchaek.moderation.dto.ModerationDtos.ReportResponse;
import com.dangsanchaek.moderation.service.BlockService;
import com.dangsanchaek.moderation.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 사용자 신고·차단 */
@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final BlockService blockService;

    /** 게시글·댓글·사용자 신고 */
    @PostMapping("/reports")
    public ResponseEntity<ReportResponse> report(@LoginUser Long userId, @Valid @RequestBody ReportCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(userId, request));
    }

    /** 사용자 차단: 이후 그 사용자의 게시글·댓글이 보이지 않는다 */
    @PostMapping("/users/{targetUserId}/block")
    public ResponseEntity<Void> block(@LoginUser Long userId, @PathVariable Long targetUserId) {
        blockService.block(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{targetUserId}/block")
    public ResponseEntity<Void> unblock(@LoginUser Long userId, @PathVariable Long targetUserId) {
        blockService.unblock(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    /** 내가 차단한 사용자 목록 */
    @GetMapping("/users/me/blocks")
    public List<BlockedUserResponse> blocks(@LoginUser Long userId) {
        return blockService.getBlockedUsers(userId);
    }
}
