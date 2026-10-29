package com.dangsanchaek.shop.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.shop.dto.ShopDtos.CartAddRequest;
import com.dangsanchaek.shop.dto.ShopDtos.CartQuantityRequest;
import com.dangsanchaek.shop.dto.ShopDtos.CartResponse;
import com.dangsanchaek.shop.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse get(@LoginUser Long userId) {
        return cartService.getCart(userId);
    }

    @PostMapping("/items")
    public CartResponse add(@LoginUser Long userId, @Valid @RequestBody CartAddRequest request) {
        return cartService.add(userId, request.productId(), request.quantity());
    }

    @PatchMapping("/items/{cartItemId}")
    public CartResponse changeQuantity(@LoginUser Long userId, @PathVariable Long cartItemId,
                                       @Valid @RequestBody CartQuantityRequest request) {
        return cartService.changeQuantity(userId, cartItemId, request.quantity());
    }

    @DeleteMapping("/items/{cartItemId}")
    public CartResponse remove(@LoginUser Long userId, @PathVariable Long cartItemId) {
        return cartService.remove(userId, cartItemId);
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@LoginUser Long userId) {
        cartService.clear(userId);
        return ResponseEntity.noContent().build();
    }
}
