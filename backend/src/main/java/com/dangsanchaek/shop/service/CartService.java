package com.dangsanchaek.shop.service;

import com.dangsanchaek.auth.domain.UserWithdrawnEvent;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.shop.domain.CartItem;
import com.dangsanchaek.shop.domain.Product;
import com.dangsanchaek.shop.dto.ShopDtos.CartItemResponse;
import com.dangsanchaek.shop.dto.ShopDtos.CartResponse;
import com.dangsanchaek.shop.repository.CartItemRepository;
import com.dangsanchaek.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserReader userReader;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        return CartResponse.of(cartItemRepository.findAllByUserIdOrderByIdAsc(userId).stream()
                .map(CartItemResponse::from).toList());
    }

    /** 같은 상품이 이미 담겨 있으면 수량을 더한다. */
    @Transactional
    public CartResponse add(Long userId, Long productId, int quantity) {
        userReader.getActiveUser(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (!product.isOnSale()) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_ON_SALE);
        }
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .map(existing -> {
                    existing.addQuantity(quantity);
                    return existing;
                })
                .orElseGet(() -> cartItemRepository.save(new CartItem(userId, product, quantity)));
        if (item.getQuantity() > product.getStock()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
        cartItemRepository.flush();
        return getCart(userId);
    }

    @Transactional
    public CartResponse changeQuantity(Long userId, Long cartItemId, int quantity) {
        CartItem item = cartItemRepository.findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        if (quantity > item.getProduct().getStock()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
        item.changeQuantity(quantity);
        cartItemRepository.flush();
        return getCart(userId);
    }

    @Transactional
    public CartResponse remove(Long userId, Long cartItemId) {
        CartItem item = cartItemRepository.findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
        cartItemRepository.delete(item);
        cartItemRepository.flush();
        return getCart(userId);
    }

    @Transactional
    public void clear(Long userId) {
        cartItemRepository.deleteAllByUserId(userId);
    }

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        cartItemRepository.deleteAllByUserId(event.userId());
    }
}
