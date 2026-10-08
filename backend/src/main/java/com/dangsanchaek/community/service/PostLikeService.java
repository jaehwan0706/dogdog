package com.dangsanchaek.community.service;

import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.community.domain.PostLike;
import com.dangsanchaek.community.dto.PostDtos.LikeResponse;
import com.dangsanchaek.community.repository.PostLikeRepository;
import com.dangsanchaek.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 좋아요/취소는 멱등(idempotent): 이미 좋아요 상태에서 다시 눌러도 오류 없이 현재 상태를 돌려준다.
 */
@Service
@RequiredArgsConstructor
public class PostLikeService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserReader userReader;

    @Transactional
    public LikeResponse like(Long userId, Long postId) {
        userReader.getActiveUser(userId);
        ensurePostExists(postId);
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            postLikeRepository.saveAndFlush(new PostLike(postId, userId));
            postRepository.addLikeCount(postId, 1);
        }
        return new LikeResponse(postId, true, postRepository.findLikeCount(postId));
    }

    @Transactional
    public LikeResponse unlike(Long userId, Long postId) {
        ensurePostExists(postId);
        if (postLikeRepository.deleteByPostIdAndUserId(postId, userId) > 0) {
            postRepository.addLikeCount(postId, -1);
        }
        return new LikeResponse(postId, false, postRepository.findLikeCount(postId));
    }

    private void ensurePostExists(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
    }
}
