package com.dangsanchaek.auth.repository;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    /** 관리자 회원 검색: 닉네임·이메일 부분 일치, status 가 null 이면 전체 */
    @Query("""
            select u from User u
            where (:status is null or u.status = :status)
              and (:keyword is null or u.nickname like concat('%', :keyword, '%')
                                    or u.email like concat('%', :keyword, '%'))
            """)
    Page<User> search(UserStatus status, String keyword, Pageable pageable);
}
