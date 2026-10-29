package com.dangsanchaek.community.domain;

public enum PostCategory {
    /** 자유게시판 */
    FREE,
    /** 산책 친구 모집 */
    WALK_MATE,
    /** 케어 품앗이 (서로 돌봄/산책 대행 등) */
    CARE_SHARE;

    public boolean isRecruit() {
        return this == WALK_MATE || this == CARE_SHARE;
    }
}
