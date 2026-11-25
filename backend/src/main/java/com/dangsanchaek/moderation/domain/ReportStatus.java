package com.dangsanchaek.moderation.domain;

public enum ReportStatus {
    /** 검토 대기 */
    PENDING,
    /** 조치 완료 (게시글·댓글 숨김 또는 회원 이용정지) */
    ACTION_TAKEN,
    /** 문제 없음으로 종료 */
    DISMISSED
}
