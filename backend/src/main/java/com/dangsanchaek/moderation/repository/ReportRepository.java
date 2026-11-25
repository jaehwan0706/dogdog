package com.dangsanchaek.moderation.repository;

import com.dangsanchaek.moderation.domain.Report;
import com.dangsanchaek.moderation.domain.ReportStatus;
import com.dangsanchaek.moderation.domain.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetId(Long reporterId, ReportTargetType targetType, Long targetId);

    @Query("select r from Report r where (:status is null or r.status = :status)")
    Page<Report> search(ReportStatus status, Pageable pageable);

    /** 같은 대상에 대한 검토 대기 신고 (한 건을 처리하면 함께 처리) */
    List<Report> findByTargetTypeAndTargetIdAndStatus(ReportTargetType targetType, Long targetId, ReportStatus status);

    long countByTargetTypeAndTargetId(ReportTargetType targetType, Long targetId);
}
