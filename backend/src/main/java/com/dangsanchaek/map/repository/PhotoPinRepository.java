package com.dangsanchaek.map.repository;

import com.dangsanchaek.map.domain.PhotoPin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PhotoPinRepository extends JpaRepository<PhotoPin, Long> {

    List<PhotoPin> findAllByOwnerIdOrderByIdDesc(Long ownerId);

    @Query("select p.imageKey from PhotoPin p where p.owner.id = :ownerId")
    List<String> findImageKeysByOwnerId(Long ownerId);

    @Modifying
    @Query("delete from PhotoPin p where p.owner.id = :ownerId")
    int deleteAllByOwnerId(Long ownerId);
}
