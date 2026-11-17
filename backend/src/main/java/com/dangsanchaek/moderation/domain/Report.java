package com.dangsanchaek.moderation.domain;

import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 게시글·댓글·사용자 신고. 대상은 (targetType, targetId) 로만 가리키고, 대상이 지워져도 신고 기록은 남긴다.
 */
@Getter
@Entity
@Table(name = "reports", uniqueConstraints = @UniqueConstraint(name = "uk_reports_reporter_target",
        columnNames = {"reporter_id", "target_type", "target_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private ReportReason reason;

    @Column(length = 500)
    private String detail;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @Column(name = "admin_memo", length = 500)
    private String adminMemo;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public Report(Long reporterId, ReportTargetType targetType, Long targetId, ReportReason reason, String detail) {
        this.reporterId = reporterId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.detail = detail;
        this.status = ReportStatus.PENDING;
    }

    public boolean isPending() {
        return status == ReportStatus.PENDING;
    }

    public void resolve(ReportStatus result, Long adminId, String memo) {
        this.status = result;
        this.resolvedBy = adminId;
        this.resolvedAt = LocalDateTime.now();
        this.adminMemo = memo;
    }
}
