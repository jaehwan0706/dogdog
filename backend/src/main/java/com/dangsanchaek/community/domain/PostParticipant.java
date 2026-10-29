package com.dangsanchaek.community.domain;

import com.dangsanchaek.auth.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** 산책 친구 모집 / 케어 품앗이 참여 신청 */
@Getter
@Entity
@Table(name = "post_participants", uniqueConstraints = @UniqueConstraint(name = "uk_post_participants_post_user",
        columnNames = {"post_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PostParticipant(Long postId, User user) {
        this.postId = postId;
        this.user = user;
    }
}
