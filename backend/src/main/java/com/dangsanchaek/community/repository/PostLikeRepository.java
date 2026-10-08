package com.dangsanchaek.community.repository;

import com.dangsanchaek.community.domain.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Set;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    @Modifying
    @Query("delete from PostLike l where l.postId = :postId and l.userId = :userId")
    int deleteByPostIdAndUserId(Long postId, Long userId);

    @Query("select l.postId from PostLike l where l.userId = :userId and l.postId in :postIds")
    Set<Long> findLikedPostIds(Long userId, Collection<Long> postIds);
}
