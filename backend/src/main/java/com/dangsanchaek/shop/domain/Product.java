package com.dangsanchaek.shop.domain;

import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 마켓 상품. 재고(stock)는 동시 주문 시 초과 판매를 막기 위해 Repository 의 원자적 UPDATE 로만 차감/복구한다.
 */
@Getter
@Entity
@DynamicUpdate
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 5000)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private ProductCategory category;

    /** 판매가(원) */
    @Column(nullable = false)
    private int price;

    @Column(nullable = false)
    private int stock;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Builder
    private Product(String name, String description, ProductCategory category, int price, int stock,
                    String imageUrl, ProductStatus status) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.status = status == null ? ProductStatus.ON_SALE : status;
    }

    public boolean isOnSale() {
        return status == ProductStatus.ON_SALE;
    }

    public void changeName(String name) { this.name = name; }

    public void changeDescription(String description) { this.description = description; }

    public void changeCategory(ProductCategory category) { this.category = category; }

    public void changePrice(int price) { this.price = price; }

    public void changeStock(int stock) { this.stock = stock; }

    public void changeImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public void changeStatus(ProductStatus status) { this.status = status; }
}
