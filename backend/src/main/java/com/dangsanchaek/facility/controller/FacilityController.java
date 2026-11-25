package com.dangsanchaek.facility.controller;

import com.dangsanchaek.facility.domain.FacilityCategory;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilityDetailResponse;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilityMapResponse;
import com.dangsanchaek.facility.dto.FacilityDtos.FacilitySummaryResponse;
import com.dangsanchaek.facility.service.FacilityService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 반려동물 동반 가능 시설 (공공데이터). 로그인 없이 조회할 수 있다.
 * categories 는 콤마 구분 (예: CAFE,RESTAURANT), 생략하면 전체.
 */
@RestController
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    /** 지도에 보이는 범위(남서·북동 꼭짓점) 안의 시설. 화면 가운데에서 가까운 순으로 최대 limit 개. */
    @GetMapping("/facilities")
    public FacilityMapResponse inBounds(
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double swLat,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double swLng,
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double neLat,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double neLng,
            @RequestParam(required = false) List<FacilityCategory> categories,
            @RequestParam(required = false) Integer limit) {
        return facilityService.findInBounds(swLat, swLng, neLat, neLng, categories, limit);
    }

    /** 이름 검색. lat·lng(보통 지도 가운데)에서 가까운 순으로 최대 30개. */
    @GetMapping("/facilities/search")
    public List<FacilitySummaryResponse> search(
            @RequestParam String q,
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
            @RequestParam(required = false) List<FacilityCategory> categories) {
        return facilityService.search(q, categories, lat, lng);
    }

    @GetMapping("/facilities/{facilityId}")
    public FacilityDetailResponse detail(@PathVariable Long facilityId) {
        return facilityService.getDetail(facilityId);
    }
}
