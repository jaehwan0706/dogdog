package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * @param mode            mock(로컬 테스트, 실제 PG 호출 없음) | toss(토스페이먼츠 승인 API 호출)
 * @param tossSecretKey   토스페이먼츠 시크릿 키 (mode=toss 일 때 필수)
 * @param pendingOrderTtl 결제 대기 주문 자동 취소(재고 복구)까지의 시간
 */
@ConfigurationProperties("app.payment")
public record PaymentProperties(String mode, String tossSecretKey, Duration pendingOrderTtl) {

    public PaymentProperties {
        if (mode == null) mode = "mock";
        if (pendingOrderTtl == null) pendingOrderTtl = Duration.ofMinutes(30);
    }
}
