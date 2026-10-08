package com.dangsanchaek.shop.domain;

public enum OrderStatus {
    /** 주문 생성, 결제 대기 (재고는 이미 차감되어 확보된 상태) */
    PENDING_PAYMENT,
    /** 결제 완료 */
    PAID,
    /** 취소 (재고 복구됨) */
    CANCELLED
}
