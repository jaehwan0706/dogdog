-- =====================================================================
-- 댕산책 초기 스키마: 회원/인증, 반려견, 커뮤니티, 애완용품 마켓
-- MySQL 8 기준 (기본 문자셋 utf8mb4 / InnoDB)
-- 열거형 값은 VARCHAR 로 저장 (JPA @Enumerated(STRING))
-- =====================================================================

-- ---------------------------------------------------------------------
-- 회원 (User)
--   provider    : LOCAL | KAKAO | GOOGLE | NAVER | APPLE
--   role        : USER | ADMIN
--   status      : ACTIVE | DELETED (탈퇴 시 개인정보 비식별화)
--   email       : 소셜 가입은 null 가능. UNIQUE 는 NULL 중복 허용
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    email             VARCHAR(255) NULL,
    password_hash     VARCHAR(255) NULL,
    nickname          VARCHAR(20)  NOT NULL,
    profile_image_url VARCHAR(500) NULL,
    provider          VARCHAR(20)  NOT NULL,
    provider_id       VARCHAR(255) NULL,
    role              VARCHAR(20)  NOT NULL,
    status            VARCHAR(20)  NOT NULL,
    deleted_at        DATETIME(6)  NULL,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_nickname UNIQUE (nickname),
    CONSTRAINT uk_users_provider UNIQUE (provider, provider_id)
);

-- 리프레시 토큰 (원문 대신 SHA-256 해시 저장, 사용 시 회전)
CREATE TABLE refresh_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 반려견 (Dog)  gender: MALE | FEMALE
-- ---------------------------------------------------------------------
CREATE TABLE dogs (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NOT NULL,
    name              VARCHAR(20)  NOT NULL,
    breed             VARCHAR(50)  NULL,
    gender            VARCHAR(10)  NULL,
    birth_date        DATE         NULL,
    weight_kg         DECIMAL(5, 2) NULL,
    neutered          BOOLEAN      NULL,
    profile_image_url VARCHAR(500) NULL,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    CONSTRAINT pk_dogs PRIMARY KEY (id),
    CONSTRAINT fk_dogs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 커뮤니티 게시글 (Post)
--   category       : FREE(자유) | WALK_MATE(산책 친구 모집) | CARE_SHARE(케어 품앗이)
--   recruit_status : OPEN | CLOSED (모집 게시글만, FREE 는 NULL)
-- ---------------------------------------------------------------------
CREATE TABLE posts (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    user_id           BIGINT        NOT NULL,
    category          VARCHAR(20)   NOT NULL,
    title             VARCHAR(100)  NOT NULL,
    content           VARCHAR(5000) NOT NULL,
    meet_at           DATETIME(6)   NULL,
    place_name        VARCHAR(100)  NULL,
    latitude          DOUBLE        NULL,
    longitude         DOUBLE        NULL,
    max_participants  INT           NULL,
    recruit_status    VARCHAR(20)   NULL,
    participant_count INT           NOT NULL DEFAULT 0,
    like_count        INT           NOT NULL DEFAULT 0,
    comment_count     INT           NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL,
    updated_at        DATETIME(6)   NOT NULL,
    CONSTRAINT pk_posts PRIMARY KEY (id),
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX idx_posts_category ON posts (category, id);
CREATE INDEX idx_posts_recruit_status ON posts (recruit_status, id);

CREATE TABLE post_images (
    post_id    BIGINT       NOT NULL,
    sort_order INT          NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    CONSTRAINT pk_post_images PRIMARY KEY (post_id, sort_order),
    CONSTRAINT fk_post_images_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

-- 댓글 (parent_id 가 있으면 답글, 1단계까지). 삭제는 소프트 삭제(deleted)
CREATE TABLE comments (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    post_id    BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    parent_id  BIGINT       NULL,
    content    VARCHAR(500) NOT NULL,
    deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    CONSTRAINT pk_comments PRIMARY KEY (id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
);
CREATE INDEX idx_comments_post ON comments (post_id, id);

CREATE TABLE post_likes (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    post_id    BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_post_likes PRIMARY KEY (id),
    CONSTRAINT uk_post_likes_post_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 산책 친구 모집 / 케어 품앗이 참여 신청
CREATE TABLE post_participants (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    post_id    BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_post_participants PRIMARY KEY (id),
    CONSTRAINT uk_post_participants_post_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_post_participants_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_participants_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ---------------------------------------------------------------------
-- 애완용품 마켓: 상품 (Product)
--   category : FOOD | SNACK | TOY | WALK | HYGIENE | CLOTHING | ETC
--   status   : ON_SALE | HIDDEN
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)  NOT NULL,
    description VARCHAR(5000) NULL,
    category    VARCHAR(20)   NOT NULL,
    price       INT           NOT NULL,
    stock       INT           NOT NULL,
    image_url   VARCHAR(500)  NULL,
    status      VARCHAR(20)   NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    updated_at  DATETIME(6)   NOT NULL,
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT ck_products_price CHECK (price >= 0),
    CONSTRAINT ck_products_stock CHECK (stock >= 0)
);
CREATE INDEX idx_products_status_category ON products (status, category, id);

-- 장바구니 (사용자당 상품 1행, 수량 합산)
CREATE TABLE cart_items (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    product_id BIGINT      NOT NULL,
    quantity   INT         NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_cart_items PRIMARY KEY (id),
    CONSTRAINT uk_cart_items_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 주문 (Order)  status: PENDING_PAYMENT | PAID | CANCELLED
--   order_no 는 PG(토스페이먼츠) orderId 로 사용. 카드정보는 저장하지 않고 payment_key 만 보관
-- ---------------------------------------------------------------------
CREATE TABLE orders (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    order_no       VARCHAR(64)  NOT NULL,
    user_id        BIGINT       NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    order_name     VARCHAR(100) NOT NULL,
    total_amount   INT          NOT NULL,
    receiver_name  VARCHAR(50)  NOT NULL,
    receiver_phone VARCHAR(20)  NOT NULL,
    zip_code       VARCHAR(10)  NOT NULL,
    address        VARCHAR(200) NOT NULL,
    address_detail VARCHAR(200) NULL,
    delivery_memo  VARCHAR(200) NULL,
    payment_key    VARCHAR(200) NULL,
    payment_method VARCHAR(50)  NULL,
    paid_at        DATETIME(6)  NULL,
    cancelled_at   DATETIME(6)  NULL,
    cancel_reason  VARCHAR(200) NULL,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uk_orders_order_no UNIQUE (order_no),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX idx_orders_user ON orders (user_id, id);
CREATE INDEX idx_orders_status_created ON orders (status, created_at);

-- 주문 상품 (주문 시점 상품명/가격 스냅샷)
CREATE TABLE order_items (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    order_id     BIGINT       NOT NULL,
    product_id   BIGINT       NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    unit_price   INT          NOT NULL,
    quantity     INT          NOT NULL,
    CONSTRAINT pk_order_items PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);
