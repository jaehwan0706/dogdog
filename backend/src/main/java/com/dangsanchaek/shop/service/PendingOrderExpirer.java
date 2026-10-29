package com.dangsanchaek.shop.service;

import com.dangsanchaek.config.properties.PaymentProperties;
import com.dangsanchaek.shop.domain.OrderStatus;
import com.dangsanchaek.shop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 결제하지 않고 방치된 주문을 자동 취소해 확보해 둔 재고를 돌려놓는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PendingOrderExpirer {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaymentProperties paymentProperties;

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public void expirePendingOrders() {
        LocalDateTime before = LocalDateTime.now().minus(paymentProperties.pendingOrderTtl());
        List<Long> ids = orderRepository.findIdsByStatusAndCreatedAtBefore(OrderStatus.PENDING_PAYMENT, before);
        for (Long id : ids) {
            try {
                orderService.expire(id);
            } catch (RuntimeException e) {
                log.error("결제 대기 주문 자동 취소 실패: orderId={}", id, e);
            }
        }
        if (!ids.isEmpty()) {
            log.info("결제 대기 주문 {}건 자동 취소", ids.size());
        }
    }
}
