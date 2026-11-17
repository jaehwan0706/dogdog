package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;
import java.util.Locale;

/**
 * @param emails 이메일 회원가입 시 ADMIN 권한을 부여할 이메일 목록 (마켓 상품 등록용)
 */
@ConfigurationProperties("app.admin")
public record AdminProperties(List<String> emails) {

    public AdminProperties {
        emails = emails == null ? List.of() : emails.stream().map(e -> e.trim().toLowerCase(Locale.ROOT)).toList();
    }

    public boolean isAdminEmail(String email) {
        return email != null && emails.contains(email.toLowerCase(Locale.ROOT));
    }
}
