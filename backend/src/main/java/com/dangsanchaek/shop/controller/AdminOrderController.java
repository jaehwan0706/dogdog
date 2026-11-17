package com.dangsanchaek.shop.controller;

import com.dangsanchaek.common.response.PageResponse;
import com.dangsanchaek.shop.domain.OrderStatus;
import com.dangsanchaek.shop.dto.ShopDtos.OrderResponse;
import com.dangsanchaek.shop.dto.ShopDtos.ShippingUpdateRequest;
import com.dangsanchaek.shop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 관리자 주문·배송 관리 (/admin/** 는 SecurityConfig 에서 ADMIN 만 허용) */
@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public PageResponse<OrderResponse> list(@RequestParam(required = false) OrderStatus status,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return orderService.searchAll(status,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by(Sort.Direction.DESC, "id")));
    }

    /** 배송 상태 변경: PAID → SHIPPING → DELIVERED */
    @PatchMapping("/{orderNo}/shipping")
    public OrderResponse updateShipping(@PathVariable String orderNo, @Valid @RequestBody ShippingUpdateRequest request) {
        return orderService.updateShipping(orderNo, request);
    }
}
