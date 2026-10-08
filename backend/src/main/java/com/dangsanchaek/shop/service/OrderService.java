package com.dangsanchaek.shop.service;

import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.shop.domain.CartItem;
import com.dangsanchaek.shop.domain.Order;
import com.dangsanchaek.shop.domain.OrderItem;
import com.dangsanchaek.shop.domain.OrderStatus;
import com.dangsanchaek.shop.domain.Product;
import com.dangsanchaek.shop.dto.ShopDtos.OrderCreateRequest;
import com.dangsanchaek.shop.dto.ShopDtos.OrderLineRequest;
import com.dangsanchaek.shop.dto.ShopDtos.OrderResponse;
import com.dangsanchaek.shop.repository.CartItemRepository;
import com.dangsanchaek.shop.repository.OrderRepository;
import com.dangsanchaek.shop.repository.ProductRepository;
import com.dangsanchaek.shop.service.payment.PaymentGateway;
import com.dangsanchaek.shop.service.payment.PaymentResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * 주문 흐름
 * <pre>
 * 1) POST /orders                         → 재고 차감(확보) + 주문 생성(PENDING_PAYMENT), orderNo/금액 반환
 * 2) 앱에서 토스 결제창 호출 (orderId=orderNo, amount=totalAmount)
 * 3) POST /orders/{orderNo}/payments/confirm → 금액 검증 후 PG 승인 → PAID
 * *) POST /orders/{orderNo}/cancel        → (PAID 면 PG 취소) → CANCELLED + 재고 복구
 * *) 결제 대기 주문은 app.payment.pending-order-ttl 이 지나면 자동 취소
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final DateTimeFormatter ORDER_NO_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String ORDER_NO_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final PaymentGateway paymentGateway;
    private final UserReader userReader;

    @Transactional
    public OrderResponse create(Long userId, OrderCreateRequest request) {
        userReader.getActiveUser(userId);
        boolean direct = request.items() != null && !request.items().isEmpty();
        boolean fromCart = request.cartItemIds() != null && !request.cartItemIds().isEmpty();
        if (direct == fromCart) {
            throw new BusinessException(ErrorCode.ORDER_ITEMS_REQUIRED);
        }

        // productId -> 수량 (상품 ID 순으로 정렬해 재고 UPDATE 잠금 순서를 고정 → 데드락 방지)
        Map<Long, Integer> lines = new TreeMap<>();
        List<CartItem> cartItems = List.of();
        if (direct) {
            for (OrderLineRequest line : request.items()) {
                lines.merge(line.productId(), line.quantity(), Integer::sum);
            }
        } else {
            List<Long> ids = request.cartItemIds().stream().distinct().toList();
            cartItems = cartItemRepository.findAllByIdInAndUserId(ids, userId);
            if (cartItems.size() != ids.size()) {
                throw new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND);
            }
            for (CartItem item : cartItems) {
                lines.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
            }
        }

        Order order = new Order(generateOrderNo(), userId, request.receiverName().strip(), request.receiverPhone(),
                request.zipCode(), request.address(), request.addressDetail(), request.deliveryMemo());
        for (Map.Entry<Long, Integer> line : lines.entrySet()) {
            Product product = productRepository.findById(line.getKey())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            if (!product.isOnSale()) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_ON_SALE, "판매 중인 상품이 아닙니다: " + product.getName());
            }
            if (productRepository.decreaseStock(product.getId(), line.getValue()) == 0) {
                // 예외 → 트랜잭션 롤백으로 앞서 차감한 재고도 원복된다.
                throw new BusinessException(ErrorCode.OUT_OF_STOCK, "재고가 부족합니다: " + product.getName());
            }
            order.addItem(product, line.getValue());
        }
        orderRepository.saveAndFlush(order);
        if (!cartItems.isEmpty()) {
            cartItemRepository.deleteAll(cartItems);
        }
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(Long userId, Pageable pageable) {
        return PageResponse.of(orderRepository.findByUserId(userId, pageable), OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long userId, String orderNo) {
        return OrderResponse.from(orderRepository.findByOrderNo(orderNo)
                .filter(o -> o.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND)));
    }

    /**
     * 결제 승인. 클라이언트가 보낸 amount 를 서버의 주문 금액과 반드시 비교한다(금액 위변조 방지).
     */
    @Transactional
    public OrderResponse confirmPayment(Long userId, String orderNo, String paymentKey, int amount) {
        Order order = getOwnOrderForUpdate(userId, orderNo);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        if (order.getTotalAmount() != amount) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }
        PaymentResult result = paymentGateway.confirm(paymentKey, orderNo, amount);
        order.markPaid(result.paymentKey(), result.method(), result.approvedAt());
        orderRepository.flush();
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse cancel(Long userId, String orderNo, String reason) {
        Order order = getOwnOrderForUpdate(userId, orderNo);
        String cancelReason = reason == null || reason.isBlank() ? "구매자 요청" : reason.strip();
        switch (order.getStatus()) {
            case PENDING_PAYMENT -> { /* 결제 전: PG 호출 없음 */ }
            case PAID -> paymentGateway.cancel(order.getPaymentKey(), cancelReason);
            case CANCELLED -> throw new BusinessException(ErrorCode.INVALID_ORDER_STATUS);
        }
        cancelAndRestoreStock(order, cancelReason);
        orderRepository.flush();
        return OrderResponse.from(order);
    }

    /** 결제 시간 초과 주문 자동 취소 (PendingOrderExpirer 가 호출) */
    @Transactional
    public void expire(Long orderId) {
        orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getStatus() == OrderStatus.PENDING_PAYMENT)
                .ifPresent(o -> cancelAndRestoreStock(o, "결제 시간 초과"));
    }

    private void cancelAndRestoreStock(Order order, String reason) {
        for (OrderItem item : order.getItems()) {
            productRepository.increaseStock(item.getProductId(), item.getQuantity());
        }
        order.cancel(reason);
    }

    private Order getOwnOrderForUpdate(Long userId, String orderNo) {
        return orderRepository.findByOrderNoForUpdate(orderNo)
                .filter(o -> o.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    private static String generateOrderNo() {
        StringBuilder sb = new StringBuilder("DS").append(LocalDateTime.now().format(ORDER_NO_TIME)).append('-');
        for (int i = 0; i < 8; i++) {
            sb.append(ORDER_NO_CHARS.charAt(RANDOM.nextInt(ORDER_NO_CHARS.length())));
        }
        return sb.toString();
    }
}
