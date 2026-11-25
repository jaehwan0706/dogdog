package com.dangsanchaek.shop.repository;

import com.dangsanchaek.shop.domain.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @EntityGraph(attributePaths = "product")
    List<CartItem> findAllByUserIdOrderByIdAsc(Long userId);

    @EntityGraph(attributePaths = "product")
    List<CartItem> findAllByIdInAndUserId(Collection<Long> ids, Long userId);

    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("delete from CartItem c where c.userId = :userId")
    int deleteAllByUserId(Long userId);
}
