package com.dangsanchaek.map.domain;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 지도 위 사진 핀. 작성자 본인만 볼 수 있는 비공개 기록이다.
 * walkId 는 산책(walk) 도메인이 생기기 전까지 연관관계 없이 ID 만 보관한다.
 */
@Getter
@Entity
@Table(name = "photo_pins")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoPin extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(name = "walk_id")
    private Long walkId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "image_key", nullable = false, length = 200)
    private String imageKey;

    @Column(length = 200)
    private String memo;

    @Builder
    private PhotoPin(User owner, Long walkId, double latitude, double longitude, String imageKey, String memo) {
        this.owner = owner;
        this.walkId = walkId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.imageKey = imageKey;
        this.memo = memo;
    }

    public boolean isOwnedBy(Long userId) {
        return owner.getId().equals(userId);
    }
}
