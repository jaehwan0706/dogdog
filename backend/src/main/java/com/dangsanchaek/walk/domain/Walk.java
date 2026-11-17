package com.dangsanchaek.walk.domain;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.common.entity.BaseTimeEntity;
import com.dangsanchaek.dog.domain.Dog;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 산책 1회 기록. 시작하면 IN_PROGRESS 로 만들고, 산책 중 경로 좌표(WalkPoint)를 나눠 받은 뒤
 * 종료할 때 거리·시간을 확정해 FINISHED 로 바꾼다.
 */
@Getter
@Entity
@Table(name = "walks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Walk extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id")
    private Dog dog;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WalkStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "distance_meters", nullable = false)
    private int distanceMeters;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    private Walk(User owner, Dog dog, LocalDateTime startedAt) {
        this.owner = owner;
        this.dog = dog;
        this.status = WalkStatus.IN_PROGRESS;
        this.startedAt = startedAt;
    }

    public static Walk start(User owner, Dog dog, LocalDateTime now) {
        return new Walk(owner, dog, now);
    }

    public void finish(LocalDateTime now, int distanceMeters) {
        this.status = WalkStatus.FINISHED;
        this.endedAt = now;
        this.distanceMeters = distanceMeters;
        this.durationSeconds = (int) Math.max(0, Duration.between(startedAt, now).toSeconds());
    }

    public boolean isOwnedBy(Long userId) {
        return owner.getId().equals(userId);
    }

    public boolean isInProgress() {
        return status == WalkStatus.IN_PROGRESS;
    }
}
