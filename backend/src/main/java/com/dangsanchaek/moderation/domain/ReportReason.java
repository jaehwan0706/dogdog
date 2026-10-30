package com.dangsanchaek.moderation.domain;

public enum ReportReason {
    /** 스팸·광고 */
    SPAM,
    /** 욕설·비방·혐오 */
    ABUSE,
    /** 음란물·선정적 내용 */
    SEXUAL,
    /** 사기·거래 유도 */
    FRAUD,
    /** 기타 (detail 에 사유) */
    ETC
}
