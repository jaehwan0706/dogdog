package com.dangsanchaek.community.domain;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 댓글. parent 가 있으면 답글(1단계까지만 허용). 삭제는 소프트 삭제(답글 구조 유지).
 */
@Getter
@Entity
@Table(name = "comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(nullable = false)
    private boolean deleted;

    /** 관리자 숨김: 내용을 가리고 "관리자에 의해 숨겨진 댓글입니다."로 표시한다. */
    @Column(nullable = false)
    private boolean hidden;

    public Comment(Post post, User author, Comment parent, String content) {
        this.post = post;
        this.author = author;
        this.parent = parent;
        this.content = content;
    }

    public boolean isWrittenBy(Long userId) {
        return author.getId().equals(userId);
    }

    public boolean isReply() {
        return parent != null;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void changeHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public void delete() {
        this.deleted = true;
    }
}
