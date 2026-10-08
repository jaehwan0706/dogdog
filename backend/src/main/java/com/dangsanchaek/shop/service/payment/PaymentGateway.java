package com.dangsanchaek.shop.service.payment;

/**
 * 외부 PG 연동 추상화. 카드 정보는 서버에 저장하지 않고 PG 가 발급한 paymentKey 만 보관한다.
 */
public interface PaymentGateway {

    /** 결제 승인. 실패 시 BusinessException(PAYMENT_FAILED). */
    PaymentResult confirm(String paymentKey, String orderNo, int amount);

    /** 결제 전액 취소. 실패 시 BusinessException(PAYMENT_CANCEL_FAILED). */
    void cancel(String paymentKey, String reason);
}
