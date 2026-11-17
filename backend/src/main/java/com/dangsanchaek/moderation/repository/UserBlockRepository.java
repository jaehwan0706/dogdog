package com.dangsanchaek.moderation.repository;

import com.dangsanchaek.moderation.domain.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Modifying
    @Query("delete from UserBlock b where b.blockerId = :blockerId and b.blockedId = :blockedId")
    int deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    List<UserBlock> findByBlockerIdOrderByIdDesc(Long blockerId);

    @Query("select b.blockedId from UserBlock b where b.blockerId = :blockerId")
    Set<Long> findBlockedIds(Long blockerId);
}
