package com.dangsanchaek.community.repository;

import com.dangsanchaek.community.domain.Comment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = {"author", "parent"})
    List<Comment> findAllByPostIdOrderByIdAsc(Long postId);
}
