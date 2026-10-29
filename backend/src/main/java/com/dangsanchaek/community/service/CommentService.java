package com.dangsanchaek.community.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.community.domain.Comment;
import com.dangsanchaek.community.domain.Post;
import com.dangsanchaek.community.dto.PostDtos.CommentCreateRequest;
import com.dangsanchaek.community.dto.PostDtos.CommentResponse;
import com.dangsanchaek.community.repository.CommentRepository;
import com.dangsanchaek.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserReader userReader;

    @Transactional
    public CommentResponse create(Long userId, Long postId, CommentCreateRequest request) {
        User author = userReader.getActiveUser(userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .filter(p -> p.getPost().getId().equals(postId) && !p.isReply() && !p.isDeleted())
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PARENT_COMMENT));
        }
        Comment comment = commentRepository.saveAndFlush(new Comment(post, author, parent, request.content().strip()));
        postRepository.addCommentCount(postId, 1);
        return CommentResponse.of(comment, List.of());
    }

    /**
     * 게시글의 전체 댓글을 "최상위 댓글 + replies" 구조로 반환한다.
     * 삭제된 최상위 댓글은 살아있는 답글이 있을 때만 "삭제된 댓글입니다."로 남긴다.
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
        List<Comment> all = commentRepository.findAllByPostIdOrderByIdAsc(postId);
        Map<Long, List<CommentResponse>> repliesByParent = new LinkedHashMap<>();
        for (Comment c : all) {
            if (c.isReply() && !c.isDeleted()) {
                repliesByParent.computeIfAbsent(c.getParent().getId(), k -> new ArrayList<>())
                        .add(CommentResponse.of(c, List.of()));
            }
        }
        List<CommentResponse> result = new ArrayList<>();
        for (Comment c : all) {
            if (c.isReply()) continue;
            List<CommentResponse> replies = repliesByParent.getOrDefault(c.getId(), List.of());
            if (c.isDeleted() && replies.isEmpty()) continue;
            result.add(CommentResponse.of(c, replies));
        }
        return result;
    }

    @Transactional
    public CommentResponse update(Long userId, Long commentId, String content) {
        Comment comment = getOwnComment(userId, commentId);
        comment.changeContent(content.strip());
        commentRepository.flush();
        return CommentResponse.of(comment, List.of());
    }

    @Transactional
    public void delete(Long userId, Long commentId) {
        Comment comment = getOwnComment(userId, commentId);
        comment.delete();
        postRepository.addCommentCount(comment.getPost().getId(), -1);
    }

    private Comment getOwnComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.isWrittenBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return comment;
    }
}
