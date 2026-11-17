package com.dangsanchaek.course.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 도시공원 (전국도시공원정보표준데이터). ParkDataLoader 가 채우는 읽기 전용 데이터.
 */
@Getter
@Entity
@Table(name = "parks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Park {

    @Id
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** 원본 '공원구분' (근린공원, 어린이공원, 소공원, 수변공원 ...) */
    @Column(name = "park_type", nullable = false, length = 30)
    private String parkType;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "area_m2")
    private Double areaSquareMeters;

    @Column(name = "road_address", length = 200)
    private String roadAddress;

    @Column(name = "lot_address", length = 200)
    private String lotAddress;

    /** 편익시설 (화장실, 음수대 등) */
    @Column(length = 300)
    private String convenience;

    /** 운동·유희·교양·기타시설 */
    @Column(length = 500)
    private String amenities;

    @Column(name = "source_updated_at")
    private LocalDate sourceUpdatedAt;

    public String getAddress() {
        return roadAddress != null ? roadAddress : lotAddress;
    }
}
