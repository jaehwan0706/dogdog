package com.dangsanchaek.shop.service.payment;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;

import java.time.LocalDateTime;

/**
 * 로컬/Postman 테스트용 PG. 실제 결제 없이 승인한다.
 * paymentKey 가 "fail" 로 시작하면 승인 실패를 흉내 낸다.
 */
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult confirm(String paymentKey, String orderNo, int amount) {
        if (paymentKey.startsWith("fail")) {
            throw new BusinessException(ErrorCode.PAYMENT_FAILED, "[MOCK] 결제 승인 실패 테스트");
        }
        return new PaymentResult(paymentKey, "MOCK", LocalDateTime.now());
    }

    @Override
    public void cancel(String paymentKey, String reason) {
        // 항상 성공
    }
}
