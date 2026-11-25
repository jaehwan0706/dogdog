package com.dangsanchaek.walk.repository;

import com.dangsanchaek.walk.domain.Walk;
import com.dangsanchaek.walk.domain.WalkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WalkRepository extends JpaRepository<Walk, Long> {

    Optional<Walk> findFirstByOwnerIdAndStatusOrderByIdDesc(Long ownerId, WalkStatus status);

    @Query("""
            select w from Walk w left join fetch w.dog
            where w.owner.id = :ownerId and w.status = :status
              and w.startedAt >= :from and w.startedAt < :to
            order by w.startedAt desc""")
    List<Walk> findAllInRange(Long ownerId, WalkStatus status, LocalDateTime from, LocalDateTime to);

    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    @Modifying
    @Query("delete from Walk w where w.owner.id = :ownerId")
    int deleteAllByOwnerId(Long ownerId);
}
