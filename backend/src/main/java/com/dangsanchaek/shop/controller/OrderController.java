package com.dangsanchaek.shop.controller;

import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.shop.dto.ShopDtos.OrderCancelRequest;
import com.dangsanchaek.shop.dto.ShopDtos.OrderCreateRequest;
import com.dangsanchaek.shop.dto.ShopDtos.OrderResponse;
import com.dangsanchaek.shop.dto.ShopDtos.PaymentConfirmRequest;
import com.dangsanchaek.shop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** 주문 생성(결제 대기). 응답의 orderNo / totalAmount / orderName 으로 앱에서 토스 결제창을 띄운다. */
    @PostMapping
    public ResponseEntity<OrderResponse> create(@LoginUser Long userId, @Valid @RequestBody OrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(userId, request));
    }

    @GetMapping
    public PageResponse<OrderResponse> myOrders(@LoginUser Long userId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return orderService.getMyOrders(userId,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), Sort.by(Sort.Direction.DESC, "id")));
    }

    @GetMapping("/{orderNo}")
    public OrderResponse get(@LoginUser Long userId, @PathVariable String orderNo) {
        return orderService.get(userId, orderNo);
    }

    /** 결제 승인: 토스 successUrl 로 받은 paymentKey, amount 전달 */
    @PostMapping("/{orderNo}/payments/confirm")
    public OrderResponse confirmPayment(@LoginUser Long userId, @PathVariable String orderNo,
                                        @Valid @RequestBody PaymentConfirmRequest request) {
        return orderService.confirmPayment(userId, orderNo, request.paymentKey(), request.amount());
    }

    @PostMapping("/{orderNo}/cancel")
    public OrderResponse cancel(@LoginUser Long userId, @PathVariable String orderNo,
                                @Valid @RequestBody(required = false) OrderCancelRequest request) {
        return orderService.cancel(userId, orderNo, request == null ? null : request.reason());
    }
}
