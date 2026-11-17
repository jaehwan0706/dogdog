package com.dangsanchaek.course.repository;

import com.dangsanchaek.course.domain.Park;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ParkRepository extends JpaRepository<Park, Long> {

    /**
     * 위도·경도 사각형 안의 공원을 (lat, lng) 에서 가까운 순으로.
     * 거리는 정렬용 근사값: 경도 1도의 길이가 위도에 따라 줄어드는 만큼 lngScale(= cos²(위도)) 을 곱한다.
     */
    @Query("""
            select p from Park p
            where p.latitude between :minLat and :maxLat
              and p.longitude between :minLng and :maxLng
            order by (p.latitude - :lat) * (p.latitude - :lat)
                   + (p.longitude - :lng) * (p.longitude - :lng) * :lngScale
            """)
    List<Park> findInBounds(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                            @Param("minLng") double minLng, @Param("maxLng") double maxLng,
                            @Param("lat") double lat, @Param("lng") double lng,
                            @Param("lngScale") double lngScale, Pageable pageable);
}
