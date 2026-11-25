package com.dangsanchaek.shop.domain;

public enum OrderStatus {
    /** 주문 생성, 결제 대기 (재고는 이미 차감되어 확보된 상태) */
    PENDING_PAYMENT,
    /** 결제 완료 (배송 준비중) */
    PAID,
    /** 배송중 (관리자가 송장 등록) */
    SHIPPING,
    /** 배송 완료 */
    DELIVERED,
    /** 취소 (재고 복구됨) */
    CANCELLED
}
