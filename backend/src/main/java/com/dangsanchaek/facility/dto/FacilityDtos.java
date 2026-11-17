package com.dangsanchaek.facility.dto;

import com.dangsanchaek.facility.domain.Facility;
import com.dangsanchaek.facility.domain.FacilityCategory;

import java.time.LocalDate;
import java.util.List;

public final class FacilityDtos {

    private FacilityDtos() {
    }

    /** 지도 마커·목록용 요약 */
    public record FacilitySummaryResponse(
            Long id,
            String name,
            FacilityCategory category,
            String categoryLabel,
            double latitude,
            double longitude,
            String address
    ) {
        public static FacilitySummaryResponse from(Facility f) {
            return new FacilitySummaryResponse(f.getId(), f.getName(), f.getCategory(), f.getCategory().getLabel(),
                    f.getLatitude(), f.getLongitude(), f.getAddress());
        }
    }

    /** truncated: 범위 안에 limit 보다 많은 시설이 있어 가까운 것만 담았음 (앱은 "확대하면 더 보여요" 안내) */
    public record FacilityMapResponse(List<FacilitySummaryResponse> facilities, boolean truncated) {
    }

    /** 상세 카드. 원본에 값이 없거나 "정보없음"이면 null */
    public record FacilityDetailResponse(
            Long id,
            String name,
            FacilityCategory category,
            String categoryLabel,
            double latitude,
            double longitude,
            String roadAddress,
            String lotAddress,
            String phone,
            String homepage,
            String closedDays,
            String openingHours,
            Boolean parking,
            Boolean indoor,
            Boolean outdoor,
            String petSize,
            String petRestrictions,
            String petExtraFee,
            String entranceFee,
            String description,
            LocalDate sourceUpdatedAt
    ) {
        public static FacilityDetailResponse from(Facility f) {
            return new FacilityDetailResponse(f.getId(), f.getName(), f.getCategory(), f.getCategory().getLabel(),
                    f.getLatitude(), f.getLongitude(), f.getRoadAddress(), f.getLotAddress(), f.getPhone(),
                    f.getHomepage(), f.getClosedDays(), f.getOpeningHours(), f.getParking(), f.getIndoor(),
                    f.getOutdoor(), f.getPetSize(), f.getPetRestrictions(), f.getPetExtraFee(), f.getEntranceFee(),
                    f.getDescription(), f.getSourceUpdatedAt());
        }
    }
}
