package com.dangsanchaek.facility.service;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.facility.domain.Facility;
import com.dangsanchaek.facility.domain.FacilityCategory;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilityDetailResponse;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilityMapResponse;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilitySummaryResponse;
import com.dangsanchaek.facility.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityService {

    /** 한 번에 내려주는 최대 마커 수 (WebView 지도가 버벅이지 않을 정도) */
    public static final int MAX_MAP_RESULTS = 300;
    public static final int DEFAULT_MAP_RESULTS = 200;
    public static final int MAX_SEARCH_RESULTS = 30;
    /** 너무 넓은 범위(전국 등)를 한 번에 조회하지 않도록 사각형 한 변의 최대 크기(도) ≈ 55km */
    public static final double MAX_SPAN_DEGREES = 0.5;

    private final FacilityRepository facilityRepository;

    public FacilityMapResponse findInBounds(double swLat, double swLng, double neLat, double neLng,
                                            Collection<FacilityCategory> categories, Integer limit) {
        if (swLat > neLat || swLng > neLng) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지도 범위가 올바르지 않습니다.");
        }
        if (neLat - swLat > MAX_SPAN_DEGREES || neLng - swLng > MAX_SPAN_DEGREES) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지도를 더 확대해 주세요.");
        }
        int size = clamp(limit == null ? DEFAULT_MAP_RESULTS : limit, MAX_MAP_RESULTS);
        double centerLat = (swLat + neLat) / 2;
        double centerLng = (swLng + neLng) / 2;
        // 하나 더 받아 보고 넘치면 truncated
        List<Facility> found = facilityRepository.findInBounds(swLat, neLat, swLng, neLng, orAll(categories),
                centerLat, centerLng, lngScale(centerLat), PageRequest.of(0, size + 1));
        boolean truncated = found.size() > size;
        List<FacilitySummaryResponse> facilities = found.stream().limit(size).map(FacilitySummaryResponse::from).toList();
        return new FacilityMapResponse(facilities, truncated);
    }

    public List<FacilitySummaryResponse> search(String keyword, Collection<FacilityCategory> categories,
                                                double lat, double lng) {
        String trimmed = keyword == null ? "" : keyword.trim();
        if (trimmed.isEmpty()) {
            return List.of();
        }
        // LIKE 의 특수문자는 글자 그대로 찾도록 지운다 (시설명에 거의 쓰이지 않음)
        String escaped = trimmed.replace("%", "").replace("_", "");
        if (escaped.isEmpty()) {
            return List.of();
        }
        return facilityRepository.searchByName(escaped, orAll(categories), lat, lng, lngScale(lat),
                        PageRequest.of(0, MAX_SEARCH_RESULTS))
                .stream().map(FacilitySummaryResponse::from).toList();
    }

    public FacilityDetailResponse getDetail(Long id) {
        return facilityRepository.findById(id)
                .map(FacilityDetailResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.FACILITY_NOT_FOUND));
    }

    private static Collection<FacilityCategory> orAll(Collection<FacilityCategory> categories) {
        return categories == null || categories.isEmpty() ? EnumSet.allOf(FacilityCategory.class) : categories;
    }

    private static double lngScale(double latitude) {
        double cos = Math.cos(Math.toRadians(latitude));
        return cos * cos;
    }

    private static int clamp(int value, int max) {
        return Math.max(1, Math.min(value, max));
    }
}
