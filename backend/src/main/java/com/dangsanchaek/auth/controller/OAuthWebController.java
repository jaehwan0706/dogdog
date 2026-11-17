package com.dangsanchaek.auth.controller;

import com.dangsanchaek.auth.dto.AuthDtos.OAuthTicketRequest;
import com.dangsanchaek.auth.dto.AuthDtos.TokenResponse;
import com.dangsanchaek.auth.service.oauth.OAuthWebLoginService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 서버 웹 로그인: 앱이 브라우저로 start 를 열고, 끝나면 ticket 을 토큰으로 교환한다. (흐름은 OAuthWebLoginService 참고) */
@RestController
@RequestMapping("/auth/oauth")
@RequiredArgsConstructor
public class OAuthWebController {

    private final OAuthWebLoginService webLoginService;

    /** provider = kakao | naver | google, redirect = 로그인 후 돌아갈 앱 주소 */
    @GetMapping("/{provider}/start")
    public ResponseEntity<Void> start(@PathVariable String provider, @RequestParam String redirect) {
        return ResponseEntity.status(HttpStatus.FOUND).location(webLoginService.start(provider, redirect)).build();
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<Void> callback(@PathVariable String provider,
                                         @RequestParam(required = false) String code,
                                         @RequestParam(required = false) String state,
                                         @RequestParam(required = false) String error) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(webLoginService.callback(provider, code, state, error)).build();
    }

    @PostMapping("/exchange")
    public TokenResponse exchange(@Valid @RequestBody OAuthTicketRequest request) {
        return webLoginService.exchange(request.ticket());
    }
}
