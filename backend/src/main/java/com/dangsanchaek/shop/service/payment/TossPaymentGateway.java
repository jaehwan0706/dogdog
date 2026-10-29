package com.dangsanchaek.shop.service.payment;

import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Map;

/**
 * 토스페이먼츠 결제 승인/취소 API 연동.
 * https://docs.tosspayments.com/reference#결제-승인
 */
@Slf4j
public class TossPaymentGateway implements PaymentGateway {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final RestClient client;

    public TossPaymentGateway(String secretKey) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("app.payment.mode=toss 이면 app.payment.toss-secret-key 가 필요합니다.");
        }
        String basic = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.client = RestClient.builder()
                .baseUrl("https://api.tosspayments.com")
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .build();
    }

    @Override
    public PaymentResult confirm(String paymentKey, String orderNo, int amount) {
        try {
            TossPayment payment = client.post().uri("/v1/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("paymentKey", paymentKey, "orderId", orderNo, "amount", amount))
                    .retrieve()
                    .body(TossPayment.class);
            if (payment == null || !"DONE".equals(payment.status())) {
                throw new BusinessException(ErrorCode.PAYMENT_FAILED);
            }
            LocalDateTime approvedAt = payment.approvedAt() == null ? LocalDateTime.now()
                    : OffsetDateTime.parse(payment.approvedAt()).atZoneSameInstant(SEOUL).toLocalDateTime();
            return new PaymentResult(payment.paymentKey(), payment.method(), approvedAt);
        } catch (RestClientResponseException e) {
            log.warn("Toss confirm failed: orderNo={}, status={}, body={}", orderNo, e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        } catch (RestClientException e) {
            log.error("Toss confirm error: orderNo={}", orderNo, e);
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        }
    }

    @Override
    public void cancel(String paymentKey, String reason) {
        try {
            client.post().uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("cancelReason", reason))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Toss cancel error: paymentKey={}", paymentKey, e);
            throw new BusinessException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TossPayment(String paymentKey, String orderId, String status, String method, String approvedAt) {
    }
}
