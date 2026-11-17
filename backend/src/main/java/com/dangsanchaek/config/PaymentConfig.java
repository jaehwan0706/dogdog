package com.dangsanchaek.config;

import com.dangsanchaek.config.properties.PaymentProperties;
import com.dangsanchaek.shop.service.payment.MockPaymentGateway;
import com.dangsanchaek.shop.service.payment.PaymentGateway;
import com.dangsanchaek.shop.service.payment.TossPaymentGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class PaymentConfig {

    @Bean
    public PaymentGateway paymentGateway(PaymentProperties properties) {
        if ("toss".equalsIgnoreCase(properties.mode())) {
            return new TossPaymentGateway(properties.tossSecretKey());
        }
        log.warn("app.payment.mode={} : 실제 결제 없이 승인하는 MockPaymentGateway 를 사용합니다.", properties.mode());
        return new MockPaymentGateway();
    }
}
