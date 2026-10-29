package com.dangsanchaek.community.repository;

import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.domain.PostCategory;
import com.dangsanchaek.community.domain.RecruitStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = "author")
    @Query("""
            select p from Post p
            where (:category is null or p.category = :category)
              and (:recruitStatus is null or p.recruitStatus = :recruitStatus)
              and (:keyword is null or p.title like concat('%', :keyword, '%')
                                    or p.content like concat('%', :keyword, '%'))
            """)
    Page<Post> search(PostCategory category, RecruitStatus recruitStatus, String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findWithAuthorById(Long id);

    /** 모집 참여 신청 시 인원 초과를 막기 위한 행 잠금 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findByIdForUpdate(Long id);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + :delta where p.id = :id")
    int addLikeCount(Long id, int delta);

    @Modifying
    @Query("update Post p set p.commentCount = p.commentCount + :delta where p.id = :id")
    int addCommentCount(Long id, int delta);

    @Query("select p.likeCount from Post p where p.id = :id")
    int findLikeCount(Long id);
}
