package com.dangsanchaek.auth.controller;

import com.dangsanchaek.auth.dto.AuthDtos.AvailabilityResponse;
import com.dangsanchaek.auth.dto.AuthDtos.LoginRequest;
import com.dangsanchaek.auth.dto.AuthDtos.RefreshRequest;
import com.dangsanchaek.auth.dto.AuthDtos.SignupRequest;
import com.dangsanchaek.auth.dto.AuthDtos.SocialLoginRequest;
import com.dangsanchaek.auth.dto.AuthDtos.TokenResponse;
import com.dangsanchaek.auth.service.AuthService;
import com.dangsanchaek.auth.service.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;

    /** 이메일 회원가입 (가입 즉시 로그인 토큰 발급) */
    @PostMapping("/signup")
    public ResponseEntity<TokenResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    /** 이메일 로그인 */
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** 소셜 로그인/자동가입: provider = kakao | google | naver | apple */
    @PostMapping("/social/{provider}")
    public TokenResponse socialLogin(@PathVariable String provider, @Valid @RequestBody SocialLoginRequest request) {
        return authService.socialLogin(provider, request);
    }

    /** Access Token 재발급 (Refresh Token 회전) */
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return tokenService.refresh(request.refreshToken());
    }

    /** 로그아웃: 해당 기기의 Refresh Token 폐기 */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        tokenService.revoke(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    /** 이메일 중복 확인 */
    @GetMapping("/check-email")
    public AvailabilityResponse checkEmail(@RequestParam @NotBlank String email) {
        return new AvailabilityResponse(authService.isEmailAvailable(email));
    }

    /** 닉네임 중복 확인 */
    @GetMapping("/check-nickname")
    public AvailabilityResponse checkNickname(@RequestParam @NotBlank String nickname) {
        return new AvailabilityResponse(authService.isNicknameAvailable(nickname));
    }
}
