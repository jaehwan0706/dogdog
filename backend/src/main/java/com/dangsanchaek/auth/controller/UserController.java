package com.dangsanchaek.auth.controller;

import com.dangsanchaek.auth.dto.AuthDtos.ChangePasswordRequest;
import com.dangsanchaek.auth.dto.AuthDtos.UpdateProfileRequest;
import com.dangsanchaek.auth.dto.AuthDtos.UserResponse;
import com.dangsanchaek.auth.service.UserService;
import com.dangsanchaek.common.security.LoginUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public UserResponse me(@LoginUser Long userId) {
        return userService.getMe(userId);
    }

    @PatchMapping
    public UserResponse updateProfile(@LoginUser Long userId, @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(userId, request);
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(@LoginUser Long userId,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    /** 회원 탈퇴 */
    @DeleteMapping
    public ResponseEntity<Void> withdraw(@LoginUser Long userId) {
        userService.withdraw(userId);
        return ResponseEntity.noContent().build();
    }
}
