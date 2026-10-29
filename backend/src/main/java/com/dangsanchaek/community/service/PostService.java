package com.dangsanchaek.community.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.domain.PostCategory;
import com.dangsanchaek.community.domain.RecruitStatus;
import com.dangsanchaek.community.dto.PostDtos.PostCreateRequest;
import com.dangsanchaek.community.dto.PostDtos.PostDetailResponse;
import com.dangsanchaek.community.dto.PostDtos.PostSummaryResponse;
import com.dangsanchaek.community.dto.PostDtos.PostUpdateRequest;
import com.dangsanchaek.community.repository.PostLikeRepository;
import com.dangsanchaek.community.repository.PostParticipantRepository;
import com.dangsanchaek.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostParticipantRepository participantRepository;
    private final UserReader userReader;

    @Transactional
    public PostDetailResponse create(Long userId, PostCreateRequest request) {
        User author = userReader.getActiveUser(userId);
        if (request.category().isRecruit()) {
            validateRecruitFields(request.meetAt(), request.maxParticipants());
        }
        Post post = postRepository.save(Post.builder()
                .author(author)
                .category(request.category())
                .title(request.title().strip())
                .content(request.content())
                .imageUrls(request.imageUrls())
                .meetAt(request.meetAt())
                .placeName(request.placeName())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .maxParticipants(request.maxParticipants())
                .build());
        postRepository.flush();
        return PostDetailResponse.of(post, false, true, false);
    }

    /**
     * 목록 조회. 모든 조건은 선택. 로그인 상태면 likedByMe 를 채운다.
     */
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> search(Long viewerId, PostCategory category, RecruitStatus recruitStatus,
                                                    String keyword, Pageable pageable) {
        String kw = keyword == null || keyword.isBlank() ? null : keyword.strip();
        Page<Post> page = postRepository.search(category, recruitStatus, kw, pageable);
        return toSummaryPage(viewerId, page);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getMyPosts(Long userId, Pageable pageable) {
        return toSummaryPage(userId, postRepository.findByAuthorId(userId, pageable));
    }

    @Transactional(readOnly = true)
    public PostDetailResponse get(Long viewerId, Long postId) {
        Post post = postRepository.findWithAuthorById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (viewerId == null) {
            return PostDetailResponse.of(post, false, false, false);
        }
        return PostDetailResponse.of(post,
                postLikeRepository.existsByPostIdAndUserId(postId, viewerId),
                post.isWrittenBy(viewerId),
                post.isRecruit() && participantRepository.existsByPostIdAndUserId(postId, viewerId));
    }

    @Transactional
    public PostDetailResponse update(Long userId, Long postId, PostUpdateRequest request) {
        Post post = getOwnPost(userId, postId);
        if (request.title() != null) post.changeTitle(request.title().strip());
        if (request.content() != null) post.changeContent(request.content());
        if (request.imageUrls() != null) post.replaceImages(request.imageUrls());

        if (post.isRecruit()) {
            if (request.meetAt() != null) {
                validateRecruitFields(request.meetAt(), 1);
                post.changeMeetAt(request.meetAt());
            }
            post.changePlace(request.placeName(), request.latitude(), request.longitude());
            if (request.maxParticipants() != null) {
                if (request.maxParticipants() < post.getParticipantCount()) {
                    throw new BusinessException(ErrorCode.MAX_PARTICIPANTS_TOO_SMALL);
                }
                post.changeMaxParticipants(request.maxParticipants());
            }
        }
        postRepository.flush();
        return PostDetailResponse.of(post, postLikeRepository.existsByPostIdAndUserId(postId, userId), true, false);
    }

    @Transactional
    public void delete(Long userId, Long postId) {
        // 댓글/좋아요/참여 내역은 DB FK(ON DELETE CASCADE)로 함께 삭제된다.
        postRepository.delete(getOwnPost(userId, postId));
    }

    Post getOwnPost(Long userId, Long postId) {
        Post post = postRepository.findWithAuthorById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.isWrittenBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return post;
    }

    private PageResponse<PostSummaryResponse> toSummaryPage(Long viewerId, Page<Post> page) {
        Set<Long> liked = Set.of();
        if (viewerId != null && page.hasContent()) {
            List<Long> ids = page.getContent().stream().map(Post::getId).toList();
            liked = postLikeRepository.findLikedPostIds(viewerId, ids);
        }
        Set<Long> likedIds = liked;
        return PageResponse.of(page, post -> PostSummaryResponse.of(post, likedIds.contains(post.getId())));
    }

    private static void validateRecruitFields(LocalDateTime meetAt, Integer maxParticipants) {
        if (meetAt == null || maxParticipants == null || meetAt.isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.RECRUIT_FIELDS_REQUIRED);
        }
    }
}
