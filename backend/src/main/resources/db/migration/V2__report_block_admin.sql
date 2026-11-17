-- =====================================================================
-- 신고 · 차단 · 관리자 운영 (게시글/댓글 숨김, 회원 이용정지, 배송 상태)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 신고 (Report)
--   target_type : POST | COMMENT | USER
--   reason      : SPAM | ABUSE | SEXUAL | FRAUD | ETC
--   status      : PENDING(검토 대기) | ACTION_TAKEN(숨김/정지 조치) | DISMISSED(문제 없음)
--   같은 사람이 같은 대상을 중복 신고할 수 없다.
-- ---------------------------------------------------------------------
CREATE TABLE reports (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    reporter_id BIGINT       NOT NULL,
    target_type VARCHAR(20)  NOT NULL,
    target_id   BIGINT       NOT NULL,
    reason      VARCHAR(20)  NOT NULL,
    detail      VARCHAR(500) NULL,
    status      VARCHAR(20)  NOT NULL,
    admin_memo  VARCHAR(500) NULL,
    resolved_by BIGINT       NULL,
    resolved_at DATETIME(6)  NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT uk_reports_reporter_target UNIQUE (reporter_id, target_type, target_id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id)
);

CREATE INDEX idx_reports_status ON reports (status, id);
CREATE INDEX idx_reports_target ON reports (target_type, target_id);

-- ---------------------------------------------------------------------
-- 차단 (UserBlock): blocker 가 blocked 의 게시글·댓글을 보지 않는다.
-- ---------------------------------------------------------------------
CREATE TABLE user_blocks (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    blocker_id BIGINT      NOT NULL,
    blocked_id BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_user_blocks PRIMARY KEY (id),
    CONSTRAINT uk_user_blocks_pair UNIQUE (blocker_id, blocked_id),
    CONSTRAINT fk_user_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES users (id),
    CONSTRAINT fk_user_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES users (id)
);

-- ---------------------------------------------------------------------
-- 관리자 숨김: 숨긴 게시글은 목록에서 빠지고 작성자만 볼 수 있다. 숨긴 댓글은 내용이 가려진다.
-- users.status 에 SUSPENDED(이용정지) 값이 추가된다. (컬럼 변경 없음)
-- ---------------------------------------------------------------------
ALTER TABLE posts ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------
-- 배송: orders.status 에 SHIPPING(배송중) | DELIVERED(배송완료) 값이 추가된다.
-- ---------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN courier VARCHAR(50) NULL;
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(50) NULL;
ALTER TABLE orders ADD COLUMN shipped_at DATETIME(6) NULL;
ALTER TABLE orders ADD COLUMN delivered_at DATETIME(6) NULL;
