package com.dangsanchaek.facility.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 반려동물 동반 가능 시설 (공공데이터, 읽기 전용).
 * 데이터는 FacilityDataLoader 가 JDBC 로 한꺼번에 넣으므로 엔티티에는 생성 메서드를 두지 않는다.
 */
@Getter
@Entity
@Table(name = "facilities")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FacilityCategory category;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "road_address", length = 200)
    private String roadAddress;

    @Column(name = "lot_address", length = 200)
    private String lotAddress;

    @Column(length = 30)
    private String phone;

    @Column(length = 500)
    private String homepage;

    @Column(name = "closed_days", length = 100)
    private String closedDays;

    @Column(name = "opening_hours", length = 200)
    private String openingHours;

    private Boolean parking;

    private Boolean indoor;

    private Boolean outdoor;

    @Column(name = "pet_size", length = 100)
    private String petSize;

    @Column(name = "pet_restrictions", length = 200)
    private String petRestrictions;

    @Column(name = "pet_extra_fee", length = 100)
    private String petExtraFee;

    @Column(name = "entrance_fee", length = 100)
    private String entranceFee;

    @Column(length = 200)
    private String description;

    @Column(name = "source_updated_at")
    private LocalDate sourceUpdatedAt;

    /** 도로명주소가 없으면 지번주소 */
    public String getAddress() {
        return roadAddress != null ? roadAddress : lotAddress;
    }
}
