package com.dangsanchaek.shop.domain;

import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 외부 노출용 주문번호. PG(토스페이먼츠)의 orderId 로 그대로 사용한다. */
    @Column(name = "order_no", nullable = false, unique = true, length = 64)
    private String orderNo;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    /** PG 결제창에 표시할 주문명. 예) "프리미엄 연어 사료 2kg 외 2건" */
    @Column(name = "order_name", nullable = false, length = 100)
    private String orderName;

    @Column(name = "total_amount", nullable = false)
    private int totalAmount;

    // ---- 배송지 ----
    @Column(name = "receiver_name", nullable = false, length = 50)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    @Column(name = "zip_code", nullable = false, length = 10)
    private String zipCode;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(name = "address_detail", length = 200)
    private String addressDetail;

    @Column(name = "delivery_memo", length = 200)
    private String deliveryMemo;

    // ---- 결제 ----
    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 200)
    private String cancelReason;

    @BatchSize(size = 100)
    @OrderBy("id asc")
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order(String orderNo, Long userId, String receiverName, String receiverPhone, String zipCode,
                 String address, String addressDetail, String deliveryMemo) {
        this.orderNo = orderNo;
        this.userId = userId;
        this.status = OrderStatus.PENDING_PAYMENT;
        this.receiverName = receiverName;
        this.receiverPhone = receiverPhone;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.deliveryMemo = deliveryMemo;
        this.orderName = "";
    }

    public void addItem(Product product, int quantity) {
        items.add(new OrderItem(this, product, quantity));
        this.totalAmount = items.stream().mapToInt(OrderItem::getLineAmount).sum();
        String first = items.getFirst().getProductName();
        String name = items.size() == 1 ? first : first + " 외 " + (items.size() - 1) + "건";
        this.orderName = name.length() > 100 ? name.substring(0, 100) : name;
    }

    public boolean isOwnedBy(Long userId) {
        return this.userId.equals(userId);
    }

    public void markPaid(String paymentKey, String paymentMethod, LocalDateTime paidAt) {
        this.status = OrderStatus.PAID;
        this.paymentKey = paymentKey;
        this.paymentMethod = paymentMethod;
        this.paidAt = paidAt;
    }

    public void cancel(String reason) {
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.cancelReason = reason;
    }
}
