package com.dangsanchaek.community.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.community.dto.PostDtos.CommentResponse;
import com.dangsanchaek.community.dto.PostDtos.CommentUpdateRequest;
import com.dangsanchaek.community.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PatchMapping("/{commentId}")
    public CommentResponse update(@LoginUser Long userId, @PathVariable Long commentId,
                                  @Valid @RequestBody CommentUpdateRequest request) {
        return commentService.update(userId, commentId, request.content());
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long commentId) {
        commentService.delete(userId, commentId);
        return ResponseEntity.noContent().build();
    }
}
