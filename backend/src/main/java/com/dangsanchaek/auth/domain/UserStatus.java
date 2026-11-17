package com.dangsanchaek.auth.domain;

public enum UserStatus {
    /** SUSPENDED: 관리자 이용정지 (로그인·글쓰기 불가, 해제 가능) */
    ACTIVE, SUSPENDED, DELETED
}
