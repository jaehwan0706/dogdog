package com.dangsanchaek.auth.service;

import com.dangsanchaek.auth.domain.AuthProvider;
import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserRole;
import com.dangsanchaek.auth.dto.AuthDtos.LoginRequest;
import com.dangsanchaek.auth.dto.AuthDtos.SignupRequest;
import com.dangsanchaek.auth.dto.AuthDtos.SocialLoginRequest;
import com.dangsanchaek.auth.dto.AuthDtos.TokenResponse;
import com.dangsanchaek.auth.repository.UserRepository;
import com.dangsanchaek.auth.service.social.SocialProfile;
import com.dangsanchaek.auth.service.social.SocialTokenVerifierRegistry;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.config.properties.AdminProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final NicknameGenerator nicknameGenerator;
    private final SocialTokenVerifierRegistry socialVerifiers;
    private final AdminProperties adminProperties;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        String nickname = request.nickname().strip();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByNickname(nickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }
        UserRole role = adminProperties.isAdminEmail(email) ? UserRole.ADMIN : UserRole.USER;
        User user = userRepository.save(
                User.createLocal(email, passwordEncoder.encode(request.password()), nickname, role));
        return tokenService.issue(user, true);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> u.isActive() && u.isLocal())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        return tokenService.issue(user, false);
    }

    /**
     * 소셜 로그인. 처음 보는 소셜 계정이면 자동으로 가입시키고 isNewUser=true 를 돌려준다(→ 앱은 반려견 등록 온보딩으로 이동).
     */
    @Transactional
    public TokenResponse socialLogin(String providerPath, SocialLoginRequest request) {
        AuthProvider provider = AuthProvider.fromSocialPath(providerPath);
        SocialProfile profile = socialVerifiers.verify(provider, request.token());

        return userRepository.findByProviderAndProviderId(provider, profile.providerId())
                .map(user -> tokenService.issue(user, false))
                .orElseGet(() -> tokenService.issue(registerSocialUser(provider, profile, request.nickname()), true));
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(normalizeEmail(email));
    }

    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname.strip());
    }

    private User registerSocialUser(AuthProvider provider, SocialProfile profile, String requestedNickname) {
        String email = profile.email() == null ? null : normalizeEmail(profile.email());
        if (email != null && userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_REGISTERED_WITH_OTHER_PROVIDER);
        }
        String preferred = requestedNickname != null && !requestedNickname.isBlank()
                ? requestedNickname : profile.nickname();
        String nickname = nicknameGenerator.generate(preferred);
        return userRepository.save(
                User.createSocial(provider, profile.providerId(), email, nickname, profile.profileImageUrl()));
    }

    private static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
