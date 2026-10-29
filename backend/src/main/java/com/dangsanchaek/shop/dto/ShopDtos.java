package com.dangsanchaek.shop.dto;

import com.dangsanchaek.shop.domain.CartItem;
import com.dangsanchaek.shop.domain.Order;
import com.dangsanchaek.shop.domain.OrderItem;
import com.dangsanchaek.shop.domain.OrderStatus;
import com.dangsanchaek.shop.domain.Product;
import com.dangsanchaek.shop.domain.ProductCategory;
import com.dangsanchaek.shop.domain.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class ShopDtos {

    private ShopDtos() {
    }

    // ===================== 상품 =====================

    public record ProductCreateRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 5000) String description,
            @NotNull ProductCategory category,
            @NotNull @Min(0) @Max(100_000_000) Integer price,
            @NotNull @Min(0) @Max(1_000_000) Integer stock,
            @Size(max = 500) String imageUrl,
            ProductStatus status
    ) {
    }

    public record ProductUpdateRequest(
            @Size(min = 1, max = 100) String name,
            @Size(max = 5000) String description,
            ProductCategory category,
            @Min(0) @Max(100_000_000) Integer price,
            @Min(0) @Max(1_000_000) Integer stock,
            @Size(max = 500) String imageUrl,
            ProductStatus status
    ) {
    }

    public record ProductResponse(
            Long id,
            String name,
            String description,
            ProductCategory category,
            int price,
            int stock,
            boolean soldOut,
            String imageUrl,
            ProductStatus status,
            LocalDateTime createdAt
    ) {
        public static ProductResponse from(Product p) {
            return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getCategory(), p.getPrice(),
                    p.getStock(), p.getStock() <= 0, p.getImageUrl(), p.getStatus(), p.getCreatedAt());
        }
    }

    // ===================== 장바구니 =====================

    public record CartAddRequest(
            @NotNull(message = "productId 가 필요합니다.") Long productId,
            @NotNull @Min(value = 1, message = "수량은 1개 이상이어야 합니다.") @Max(CartItem.MAX_QUANTITY) Integer quantity
    ) {
    }

    public record CartQuantityRequest(
            @NotNull @Min(value = 1, message = "수량은 1개 이상이어야 합니다.") @Max(CartItem.MAX_QUANTITY) Integer quantity
    ) {
    }

    /**
     * @param available 판매중 + 재고 충분 여부. false 인 항목은 주문할 수 없고 합계에서 제외된다.
     */
    public record CartItemResponse(Long cartItemId, Long productId, String productName, String imageUrl,
                                   int price, int quantity, int lineAmount, int stock, boolean available) {
        public static CartItemResponse from(CartItem item) {
            Product p = item.getProduct();
            boolean available = p.isOnSale() && p.getStock() >= item.getQuantity();
            return new CartItemResponse(item.getId(), p.getId(), p.getName(), p.getImageUrl(), p.getPrice(),
                    item.getQuantity(), p.getPrice() * item.getQuantity(), p.getStock(), available);
        }
    }

    public record CartResponse(List<CartItemResponse> items, int totalQuantity, int totalAmount) {
        public static CartResponse of(List<CartItemResponse> items) {
            List<CartItemResponse> available = items.stream().filter(CartItemResponse::available).toList();
            return new CartResponse(items,
                    available.stream().mapToInt(CartItemResponse::quantity).sum(),
                    available.stream().mapToInt(CartItemResponse::lineAmount).sum());
        }
    }

    // ===================== 주문 / 결제 =====================

    public record OrderLineRequest(
            @NotNull Long productId,
            @NotNull @Min(1) @Max(CartItem.MAX_QUANTITY) Integer quantity
    ) {
    }

    /**
     * items(바로 구매) 또는 cartItemIds(장바구니에서 선택 주문) 중 하나만 지정한다.
     */
    public record OrderCreateRequest(
            @Size(max = 50) List<@Valid OrderLineRequest> items,
            @Size(max = 50) List<@NotNull Long> cartItemIds,
            @NotBlank(message = "받는 분 이름을 입력해 주세요.") @Size(max = 50) String receiverName,
            @NotBlank(message = "연락처를 입력해 주세요.")
            @Pattern(regexp = "^[0-9\\-]{9,20}$", message = "연락처 형식이 올바르지 않습니다.") String receiverPhone,
            @NotBlank(message = "우편번호를 입력해 주세요.") @Size(max = 10) String zipCode,
            @NotBlank(message = "주소를 입력해 주세요.") @Size(max = 200) String address,
            @Size(max = 200) String addressDetail,
            @Size(max = 200) String deliveryMemo
    ) {
    }

    /** 토스페이먼츠 결제 성공 리다이렉트로 받은 값을 그대로 전달한다. */
    public record PaymentConfirmRequest(
            @NotBlank(message = "paymentKey 가 필요합니다.") String paymentKey,
            @NotNull(message = "amount 가 필요합니다.") Integer amount
    ) {
    }

    public record OrderCancelRequest(@Size(max = 200) String reason) {
    }

    public record OrderItemResponse(Long productId, String productName, int unitPrice, int quantity, int lineAmount) {
        public static OrderItemResponse from(OrderItem i) {
            return new OrderItemResponse(i.getProductId(), i.getProductName(), i.getUnitPrice(), i.getQuantity(),
                    i.getLineAmount());
        }
    }

    public record OrderResponse(
            String orderNo,
            String orderName,
            OrderStatus status,
            int totalAmount,
            List<OrderItemResponse> items,
            String receiverName,
            String receiverPhone,
            String zipCode,
            String address,
            String addressDetail,
            String deliveryMemo,
            String paymentMethod,
            LocalDateTime paidAt,
            LocalDateTime cancelledAt,
            String cancelReason,
            LocalDateTime createdAt
    ) {
        public static OrderResponse from(Order o) {
            return new OrderResponse(o.getOrderNo(), o.getOrderName(), o.getStatus(), o.getTotalAmount(),
                    o.getItems().stream().map(OrderItemResponse::from).toList(),
                    o.getReceiverName(), o.getReceiverPhone(), o.getZipCode(), o.getAddress(), o.getAddressDetail(),
                    o.getDeliveryMemo(), o.getPaymentMethod(), o.getPaidAt(), o.getCancelledAt(),
                    o.getCancelReason(), o.getCreatedAt());
        }
    }
}
