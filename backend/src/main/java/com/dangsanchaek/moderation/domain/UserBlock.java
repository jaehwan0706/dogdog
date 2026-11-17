package com.dangsanchaek.moderation.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** blocker 가 blocked 를 차단: blocker 에게 blocked 의 게시글·댓글이 보이지 않는다. */
@Getter
@Entity
@Table(name = "user_blocks", uniqueConstraints = @UniqueConstraint(name = "uk_user_blocks_pair",
        columnNames = {"blocker_id", "blocked_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "blocker_id", nullable = false)
    private Long blockerId;

    @Column(name = "blocked_id", nullable = false)
    private Long blockedId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserBlock(Long blockerId, Long blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
    }
}
