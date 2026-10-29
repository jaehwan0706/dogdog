package com.dangsanchaek.community.repository;

import com.dangsanchaek.community.domain.PostParticipant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostParticipantRepository extends JpaRepository<PostParticipant, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    Optional<PostParticipant> findByPostIdAndUserId(Long postId, Long userId);

    @EntityGraph(attributePaths = "user")
    List<PostParticipant> findAllByPostIdOrderByIdAsc(Long postId);
}
