package com.dangsanchaek.facility.repository;

import com.dangsanchaek.facility.domain.Facility;
import com.dangsanchaek.facility.domain.FacilityCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    /**
     * 위도·경도 사각형 안의 시설을 (lat, lng) 에서 가까운 순으로.
     * 거리는 정렬용 근사값: 경도 1도의 길이가 위도에 따라 줄어드는 만큼 lngScale(= cos²(위도)) 을 곱한다.
     */
    @Query("""
            select f from Facility f
            where f.latitude between :minLat and :maxLat
              and f.longitude between :minLng and :maxLng
              and f.category in :categories
            order by (f.latitude - :lat) * (f.latitude - :lat)
                   + (f.longitude - :lng) * (f.longitude - :lng) * :lngScale
            """)
    List<Facility> findInBounds(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                                @Param("minLng") double minLng, @Param("maxLng") double maxLng,
                                @Param("categories") Collection<FacilityCategory> categories,
                                @Param("lat") double lat, @Param("lng") double lng,
                                @Param("lngScale") double lngScale, Pageable pageable);

    /** 이름 검색 (기준 위치에서 가까운 순) */
    @Query("""
            select f from Facility f
            where lower(f.name) like lower(concat('%', :keyword, '%'))
              and f.category in :categories
            order by (f.latitude - :lat) * (f.latitude - :lat)
                   + (f.longitude - :lng) * (f.longitude - :lng) * :lngScale
            """)
    List<Facility> searchByName(@Param("keyword") String keyword,
                                @Param("categories") Collection<FacilityCategory> categories,
                                @Param("lat") double lat, @Param("lng") double lng,
                                @Param("lngScale") double lngScale, Pageable pageable);
}
