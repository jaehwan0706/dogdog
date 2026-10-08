package com.dangsanchaek.community.domain;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 커뮤니티 게시글. category 가 WALK_MATE(산책 친구 모집) / CARE_SHARE(케어 품앗이)이면 모집 필드를 사용한다.
 * like/comment 카운트는 동시성 때문에 Repository 의 원자적 UPDATE 로만 변경한다.
 */
@Getter
@Entity
@DynamicUpdate
@Table(name = "posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private PostCategory category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @BatchSize(size = 100)
    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "image_url", nullable = false, length = 500)
    private List<String> imageUrls = new ArrayList<>();

    // ---- 모집(친구모집/품앗이) 전용 필드 ----
    @Column(name = "meet_at")
    private LocalDateTime meetAt;

    @Column(name = "place_name", length = 100)
    private String placeName;

    private Double latitude;

    private Double longitude;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "recruit_status", length = 20)
    private RecruitStatus recruitStatus;

    @Column(name = "participant_count", nullable = false)
    private int participantCount;

    // ---- 카운터 ----
    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "comment_count", nullable = false)
    private int commentCount;

    @Builder
    private Post(User author, PostCategory category, String title, String content, List<String> imageUrls,
                 LocalDateTime meetAt, String placeName, Double latitude, Double longitude, Integer maxParticipants) {
        this.author = author;
        this.category = category;
        this.title = title;
        this.content = content;
        if (imageUrls != null) this.imageUrls.addAll(imageUrls);
        if (category.isRecruit()) {
            this.meetAt = meetAt;
            this.placeName = placeName;
            this.latitude = latitude;
            this.longitude = longitude;
            this.maxParticipants = maxParticipants;
            this.recruitStatus = RecruitStatus.OPEN;
        }
    }

    public boolean isWrittenBy(Long userId) {
        return author.getId().equals(userId);
    }

    public boolean isRecruit() {
        return category.isRecruit();
    }

    public boolean isFull() {
        return maxParticipants != null && participantCount >= maxParticipants;
    }

    public void changeTitle(String title) { this.title = title; }

    public void changeContent(String content) { this.content = content; }

    public void replaceImages(List<String> imageUrls) {
        this.imageUrls.clear();
        this.imageUrls.addAll(imageUrls);
    }

    public void changeMeetAt(LocalDateTime meetAt) { this.meetAt = meetAt; }

    public void changePlace(String placeName, Double latitude, Double longitude) {
        if (placeName != null) this.placeName = placeName;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
    }

    public void changeMaxParticipants(int maxParticipants) { this.maxParticipants = maxParticipants; }

    public void changeRecruitStatus(RecruitStatus status) { this.recruitStatus = status; }

    public void increaseParticipantCount() { this.participantCount++; }

    public void decreaseParticipantCount() { this.participantCount = Math.max(0, participantCount - 1); }
}
