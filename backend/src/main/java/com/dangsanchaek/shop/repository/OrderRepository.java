package com.dangsanchaek.shop.repository;

import com.dangsanchaek.shop.domain.Order;
import com.dangsanchaek.shop.domain.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNo(String orderNo);

    /** 결제 승인/취소가 동시에 처리되지 않도록 행 잠금 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.orderNo = :orderNo")
    Optional<Order> findByOrderNoForUpdate(String orderNo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(Long id);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query("select o.id from Order o where o.status = :status and o.createdAt < :before")
    List<Long> findIdsByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime before);
}
