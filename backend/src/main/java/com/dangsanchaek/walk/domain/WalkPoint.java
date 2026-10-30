package com.dangsanchaek.walk.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 산책 경로의 좌표 하나. 경로는 seq 순서로 이어 그린다. */
@Getter
@Entity
@Table(name = "walk_points")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "walk_id", nullable = false)
    private Long walkId;

    @Column(nullable = false)
    private int seq;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    public WalkPoint(Long walkId, int seq, double latitude, double longitude) {
        this.walkId = walkId;
        this.seq = seq;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
