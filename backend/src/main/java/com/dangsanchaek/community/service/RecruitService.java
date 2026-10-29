package com.dangsanchaek.community.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.domain.PostParticipant;
import com.dangsanchaek.community.domain.RecruitStatus;
import com.dangsanchaek.community.dto.PostDtos.ParticipantResponse;
import com.dangsanchaek.community.dto.PostDtos.ParticipationResponse;
import com.dangsanchaek.community.repository.PostParticipantRepository;
import com.dangsanchaek.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 산책 친구 모집(WALK_MATE) / 케어 품앗이(CARE_SHARE) 참여 신청·취소·마감.
 */
@Service
@RequiredArgsConstructor
public class RecruitService {

    private final PostRepository postRepository;
    private final PostParticipantRepository participantRepository;
    private final PostService postService;
    private final UserReader userReader;

    @Transactional
    public ParticipationResponse join(Long userId, Long postId) {
        User user = userReader.getActiveUser(userId);
        Post post = lockRecruitPost(postId);
        if (post.isWrittenBy(userId)) {
            throw new BusinessException(ErrorCode.CANNOT_JOIN_OWN_POST);
        }
        if (participantRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new BusinessException(ErrorCode.ALREADY_PARTICIPATING);
        }
        if (post.getRecruitStatus() == RecruitStatus.CLOSED) {
            throw new BusinessException(ErrorCode.RECRUIT_CLOSED);
        }
        if (post.isFull()) {
            throw new BusinessException(ErrorCode.RECRUIT_FULL);
        }
        participantRepository.save(new PostParticipant(postId, user));
        post.increaseParticipantCount();
        return ParticipationResponse.of(post, true);
    }

    @Transactional
    public ParticipationResponse leave(Long userId, Long postId) {
        Post post = lockRecruitPost(postId);
        PostParticipant participant = participantRepository.findByPostIdAndUserId(postId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_PARTICIPATING));
        participantRepository.delete(participant);
        post.decreaseParticipantCount();
        return ParticipationResponse.of(post, false);
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> getParticipants(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.isRecruit()) {
            throw new BusinessException(ErrorCode.NOT_RECRUIT_POST);
        }
        return participantRepository.findAllByPostIdOrderByIdAsc(postId).stream()
                .map(ParticipantResponse::from).toList();
    }

    /** 작성자가 모집을 마감(CLOSED)하거나 다시 연다(OPEN). */
    @Transactional
    public ParticipationResponse changeStatus(Long userId, Long postId, RecruitStatus status) {
        Post post = postService.getOwnPost(userId, postId);
        if (!post.isRecruit()) {
            throw new BusinessException(ErrorCode.NOT_RECRUIT_POST);
        }
        post.changeRecruitStatus(status);
        return ParticipationResponse.of(post, false);
    }

    private Post lockRecruitPost(Long postId) {
        Post post = postRepository.findByIdForUpdate(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.isRecruit()) {
            throw new BusinessException(ErrorCode.NOT_RECRUIT_POST);
        }
        return post;
    }
}
