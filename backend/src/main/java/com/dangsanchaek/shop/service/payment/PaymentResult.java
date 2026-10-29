package com.dangsanchaek.shop.service.payment;

import java.time.LocalDateTime;

public record PaymentResult(String paymentKey, String method, LocalDateTime approvedAt) {
}
