package com.dangsanchaek.moderation.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserStatus;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.auth.service.TokenService;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.community.domain.Comment;
import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.repository.CommentRepository;
import com.dangsanchaek.community.repository.PostRepository;
import com.dangsanchaek.moderation.dto.ModerationDtos.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 조치: 게시글·댓글 숨김/해제, 회원 이용정지/해제.
 */
@Service
@RequiredArgsConstructor
public class ModerationService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;

    @Transactional
    public void setPostHidden(Long postId, boolean hidden) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.changeHidden(hidden);
    }

    @Transactional
    public void setCommentHidden(Long commentId, boolean hidden) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        comment.changeHidden(hidden);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> searchUsers(UserStatus status, String keyword, Pageable pageable) {
        String kw = keyword == null || keyword.isBlank() ? null : keyword.strip();
        return PageResponse.of(userRepository.search(status, kw, pageable), AdminUserResponse::from);
    }

    /**
     * 이용정지하면 리프레시 토큰을 모두 폐기한다.
     * 남은 Access Token 으로는 만료(30분) 전까지 조회만 가능하고, 글쓰기 등은 UserReader 의 활성 회원 검사에서 막힌다.
     */
    @Transactional
    public AdminUserResponse changeUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getStatus() != UserStatus.DELETED)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        switch (status) {
            case SUSPENDED -> {
                if (user.isAdmin()) throw new BusinessException(ErrorCode.CANNOT_SUSPEND_ADMIN);
                user.suspend();
                tokenService.revokeAll(userId);
            }
            case ACTIVE -> user.unsuspend();
            case DELETED -> throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        userRepository.flush();
        return AdminUserResponse.from(user);
    }
}
