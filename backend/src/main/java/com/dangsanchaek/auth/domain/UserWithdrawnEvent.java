package com.dangsanchaek.auth.domain;

/**
 * 회원 탈퇴 시 발행. 다른 도메인(반려견, 장바구니 등)이 같은 트랜잭션 안에서 개인 데이터를 정리한다.
 */
public record UserWithdrawnEvent(Long userId) {
}
