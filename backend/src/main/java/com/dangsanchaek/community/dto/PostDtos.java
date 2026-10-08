package com.dangsanchaek.community.dto;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.community.domain.Comment;
import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.domain.PostCategory;
import com.dangsanchaek.community.domain.PostParticipant;
import com.dangsanchaek.community.domain.RecruitStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class PostDtos {

    private PostDtos() {
    }

    // ===================== 요청 =====================

    /**
     * category 가 WALK_MATE / CARE_SHARE 이면 meetAt, maxParticipants 필수.
     */
    public record PostCreateRequest(
            @NotNull(message = "카테고리를 선택해 주세요. (FREE, WALK_MATE, CARE_SHARE)") PostCategory category,
            @NotBlank(message = "제목을 입력해 주세요.") @Size(max = 100, message = "제목은 100자 이하여야 합니다.") String title,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(max = 5000, message = "내용은 5000자 이하여야 합니다.") String content,
            @Size(max = 10, message = "이미지는 최대 10장까지 첨부할 수 있습니다.") List<@NotBlank @Size(max = 500) String> imageUrls,
            LocalDateTime meetAt,
            @Size(max = 100) String placeName,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @Min(value = 1, message = "모집 인원은 1명 이상이어야 합니다.") @Max(value = 50) Integer maxParticipants
    ) {
    }

    /** 부분 수정: null 인 필드는 변경하지 않는다. 카테고리는 변경 불가. */
    public record PostUpdateRequest(
            @Size(min = 1, max = 100) String title,
            @Size(min = 1, max = 5000) String content,
            @Size(max = 10) List<@NotBlank @Size(max = 500) String> imageUrls,
            LocalDateTime meetAt,
            @Size(max = 100) String placeName,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @Min(1) @Max(50) Integer maxParticipants
    ) {
    }

    public record RecruitStatusRequest(@NotNull(message = "status 는 OPEN 또는 CLOSED 입니다.") RecruitStatus status) {
    }

    public record CommentCreateRequest(
            @NotBlank(message = "댓글 내용을 입력해 주세요.") @Size(max = 500, message = "댓글은 500자 이하여야 합니다.") String content,
            Long parentId
    ) {
    }

    public record CommentUpdateRequest(
            @NotBlank(message = "댓글 내용을 입력해 주세요.") @Size(max = 500) String content
    ) {
    }

    // ===================== 응답 =====================

    public record AuthorResponse(Long id, String nickname, String profileImageUrl) {
        public static AuthorResponse from(User user) {
            return new AuthorResponse(user.getId(), user.getNickname(), user.getProfileImageUrl());
        }
    }

    public record RecruitInfo(LocalDateTime meetAt, String placeName, Double latitude, Double longitude,
                              Integer maxParticipants, int participantCount, RecruitStatus status) {
        static RecruitInfo from(Post post) {
            if (!post.isRecruit()) return null;
            return new RecruitInfo(post.getMeetAt(), post.getPlaceName(), post.getLatitude(), post.getLongitude(),
                    post.getMaxParticipants(), post.getParticipantCount(), post.getRecruitStatus());
        }
    }

    public record PostSummaryResponse(
            Long id,
            PostCategory category,
            String title,
            String contentPreview,
            String thumbnailUrl,
            AuthorResponse author,
            int likeCount,
            int commentCount,
            boolean likedByMe,
            RecruitInfo recruit,
            LocalDateTime createdAt
    ) {
        public static PostSummaryResponse of(Post post, boolean likedByMe) {
            String content = post.getContent();
            String preview = content.length() > 100 ? content.substring(0, 100) + "…" : content;
            String thumbnail = post.getImageUrls().isEmpty() ? null : post.getImageUrls().getFirst();
            return new PostSummaryResponse(post.getId(), post.getCategory(), post.getTitle(), preview, thumbnail,
                    AuthorResponse.from(post.getAuthor()), post.getLikeCount(), post.getCommentCount(), likedByMe,
                    RecruitInfo.from(post), post.getCreatedAt());
        }
    }

    public record PostDetailResponse(
            Long id,
            PostCategory category,
            String title,
            String content,
            List<String> imageUrls,
            AuthorResponse author,
            int likeCount,
            int commentCount,
            boolean likedByMe,
            boolean mine,
            boolean participating,
            RecruitInfo recruit,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static PostDetailResponse of(Post post, boolean likedByMe, boolean mine, boolean participating) {
            return new PostDetailResponse(post.getId(), post.getCategory(), post.getTitle(), post.getContent(),
                    List.copyOf(post.getImageUrls()), AuthorResponse.from(post.getAuthor()), post.getLikeCount(),
                    post.getCommentCount(), likedByMe, mine, participating, RecruitInfo.from(post),
                    post.getCreatedAt(), post.getUpdatedAt());
        }
    }

    public record LikeResponse(Long postId, boolean liked, int likeCount) {
    }

    public record ParticipantResponse(Long userId, String nickname, String profileImageUrl, LocalDateTime joinedAt) {
        public static ParticipantResponse from(PostParticipant p) {
            return new ParticipantResponse(p.getUser().getId(), p.getUser().getNickname(),
                    p.getUser().getProfileImageUrl(), p.getCreatedAt());
        }
    }

    public record ParticipationResponse(Long postId, boolean participating, int participantCount,
                                        Integer maxParticipants, RecruitStatus status) {
        public static ParticipationResponse of(Post post, boolean participating) {
            return new ParticipationResponse(post.getId(), participating, post.getParticipantCount(),
                    post.getMaxParticipants(), post.getRecruitStatus());
        }
    }

    public record CommentResponse(
            Long id,
            Long parentId,
            String content,
            AuthorResponse author,
            boolean deleted,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<CommentResponse> replies
    ) {
        public static CommentResponse of(Comment c, List<CommentResponse> replies) {
            Long parentId = c.getParent() == null ? null : c.getParent().getId();
            if (c.isDeleted()) {
                return new CommentResponse(c.getId(), parentId, "삭제된 댓글입니다.", null, true,
                        c.getCreatedAt(), c.getUpdatedAt(), replies);
            }
            return new CommentResponse(c.getId(), parentId, c.getContent(), AuthorResponse.from(c.getAuthor()), false,
                    c.getCreatedAt(), c.getUpdatedAt(), replies);
        }
    }
}
