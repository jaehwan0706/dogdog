package com.dangsanchaek.walk.repository;

import com.dangsanchaek.walk.domain.WalkPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface WalkPointRepository extends JpaRepository<WalkPoint, Long> {

    List<WalkPoint> findAllByWalkIdOrderBySeqAsc(Long walkId);

    /** 여러 산책의 경로를 한 번에 (산책별 seq 순) */
    List<WalkPoint> findAllByWalkIdInOrderByWalkIdAscSeqAsc(Collection<Long> walkIds);

    /** 아직 좌표가 없으면 -1 */
    @Query("select coalesce(max(p.seq), -1) from WalkPoint p where p.walkId = :walkId")
    int findMaxSeq(Long walkId);

    long countByWalkId(Long walkId);
}
