package com.dangsanchaek.dog.repository;

import com.dangsanchaek.dog.domain.Dog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DogRepository extends JpaRepository<Dog, Long> {

    List<Dog> findAllByOwnerIdOrderByIdAsc(Long ownerId);

    long countByOwnerId(Long ownerId);

    @Modifying
    @Query("delete from Dog d where d.owner.id = :ownerId")
    int deleteAllByOwnerId(Long ownerId);
}
