package com.dangsanchaek.community.controller;

import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.community.domain.PostCategory;
import com.dangsanchaek.community.domain.RecruitStatus;
import com.dangsanchaek.community.dto.PostDtos.CommentCreateRequest;
import com.dangsanchaek.community.dto.PostDtos.CommentResponse;
import com.dangsanchaek.community.dto.PostDtos.LikeResponse;
import com.dangsanchaek.community.dto.PostDtos.ParticipantResponse;
import com.dangsanchaek.community.dto.PostDtos.ParticipationResponse;
import com.dangsanchaek.community.dto.PostDtos.PostCreateRequest;
import com.dangsanchaek.community.dto.PostDtos.PostDetailResponse;
import com.dangsanchaek.community.dto.PostDtos.PostSummaryResponse;
import com.dangsanchaek.community.dto.PostDtos.PostUpdateRequest;
import com.dangsanchaek.community.dto.PostDtos.RecruitStatusRequest;
import com.dangsanchaek.community.service.CommentService;
import com.dangsanchaek.community.service.PostLikeService;
import com.dangsanchaek.community.service.PostService;
import com.dangsanchaek.community.service.RecruitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostLikeService postLikeService;
    private final RecruitService recruitService;
    private final CommentService commentService;

    // ---------------- 게시글 ----------------

    /** 목록: GET /posts?category=WALK_MATE&recruitStatus=OPEN&keyword=한강&page=0&size=20 (비로그인 허용) */
    @GetMapping("/posts")
    public PageResponse<PostSummaryResponse> list(@LoginUser(required = false) Long userId,
                                                  @RequestParam(required = false) PostCategory category,
                                                  @RequestParam(required = false) RecruitStatus recruitStatus,
                                                  @RequestParam(required = false) String keyword,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return postService.search(userId, category, recruitStatus, keyword, pageable(page, size));
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDetailResponse> create(@LoginUser Long userId,
                                                     @Valid @RequestBody PostCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(userId, request));
    }

    @GetMapping("/posts/{postId}")
    public PostDetailResponse get(@LoginUser(required = false) Long userId, @PathVariable Long postId) {
        return postService.get(userId, postId);
    }

    @PatchMapping("/posts/{postId}")
    public PostDetailResponse update(@LoginUser Long userId, @PathVariable Long postId,
                                     @Valid @RequestBody PostUpdateRequest request) {
        return postService.update(userId, postId, request);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long postId) {
        postService.delete(userId, postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/posts")
    public PageResponse<PostSummaryResponse> myPosts(@LoginUser Long userId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return postService.getMyPosts(userId, pageable(page, size));
    }

    // ---------------- 좋아요 ----------------

    @PostMapping("/posts/{postId}/likes")
    public LikeResponse like(@LoginUser Long userId, @PathVariable Long postId) {
        return postLikeService.like(userId, postId);
    }

    @DeleteMapping("/posts/{postId}/likes")
    public LikeResponse unlike(@LoginUser Long userId, @PathVariable Long postId) {
        return postLikeService.unlike(userId, postId);
    }

    // ---------------- 친구모집 / 품앗이 참여 ----------------

    @GetMapping("/posts/{postId}/participants")
    public List<ParticipantResponse> participants(@PathVariable Long postId) {
        return recruitService.getParticipants(postId);
    }

    @PostMapping("/posts/{postId}/participants")
    public ParticipationResponse join(@LoginUser Long userId, @PathVariable Long postId) {
        return recruitService.join(userId, postId);
    }

    @DeleteMapping("/posts/{postId}/participants")
    public ParticipationResponse leave(@LoginUser Long userId, @PathVariable Long postId) {
        return recruitService.leave(userId, postId);
    }

    /** 작성자 전용: 모집 마감/재개 */
    @PatchMapping("/posts/{postId}/recruit-status")
    public ParticipationResponse changeRecruitStatus(@LoginUser Long userId, @PathVariable Long postId,
                                                     @Valid @RequestBody RecruitStatusRequest request) {
        return recruitService.changeStatus(userId, postId, request.status());
    }

    // ---------------- 댓글 (작성/조회) ----------------

    @GetMapping("/posts/{postId}/comments")
    public List<CommentResponse> comments(@PathVariable Long postId) {
        return commentService.getComments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> createComment(@LoginUser Long userId, @PathVariable Long postId,
                                                         @Valid @RequestBody CommentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(userId, postId, request));
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), Sort.by(Sort.Direction.DESC, "id"));
    }
}
