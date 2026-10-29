package com.dangsanchaek.shop.repository;

import com.dangsanchaek.shop.domain.Product;
import com.dangsanchaek.shop.domain.ProductCategory;
import com.dangsanchaek.shop.domain.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            select p from Product p
            where (:status is null or p.status = :status)
              and (:category is null or p.category = :category)
              and (:keyword is null or p.name like concat('%', :keyword, '%'))
            """)
    Page<Product> search(ProductStatus status, ProductCategory category, String keyword, Pageable pageable);

    /** 재고가 충분할 때만 차감. 반환값 0 이면 재고 부족. */
    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stock = p.stock - :quantity where p.id = :id and p.stock >= :quantity")
    int decreaseStock(Long id, int quantity);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stock = p.stock + :quantity where p.id = :id")
    int increaseStock(Long id, int quantity);
}
