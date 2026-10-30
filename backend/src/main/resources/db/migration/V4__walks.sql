-- ---------------------------------------------------------------------
-- 산책 기록 (Walk)
--   status           : IN_PROGRESS(산책 중) | FINISHED(종료·저장됨). 회원당 IN_PROGRESS 는 하나만 둔다
--   dog_id           : 함께 산책한 반려견. 반려견을 삭제해도 기록은 남긴다
--   distance_meters  : 종료 시 경로 좌표로 서버가 계산한 거리
--   duration_seconds : 종료 시 started_at ~ ended_at 으로 계산한 시간
-- ---------------------------------------------------------------------
CREATE TABLE walks (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    user_id          BIGINT      NOT NULL,
    dog_id           BIGINT      NULL,
    status           VARCHAR(20) NOT NULL,
    started_at       DATETIME(6) NOT NULL,
    ended_at         DATETIME(6) NULL,
    distance_meters  INT         NOT NULL,
    duration_seconds INT         NOT NULL,
    created_at       DATETIME(6) NOT NULL,
    updated_at       DATETIME(6) NOT NULL,
    CONSTRAINT pk_walks PRIMARY KEY (id),
    CONSTRAINT fk_walks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_walks_dog FOREIGN KEY (dog_id) REFERENCES dogs (id) ON DELETE SET NULL
);

CREATE INDEX idx_walks_user_started ON walks (user_id, started_at);

-- ---------------------------------------------------------------------
-- 산책 경로 좌표 (WalkPoint)
--   seq : 앱이 매기는 0부터의 순번. 같은 묶음을 재전송해도 (walk_id, seq) 로 중복 저장을 막는다
-- ---------------------------------------------------------------------
CREATE TABLE walk_points (
    id        BIGINT NOT NULL AUTO_INCREMENT,
    walk_id   BIGINT NOT NULL,
    seq       INT    NOT NULL,
    latitude  DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    CONSTRAINT pk_walk_points PRIMARY KEY (id),
    CONSTRAINT fk_walk_points_walk FOREIGN KEY (walk_id) REFERENCES walks (id) ON DELETE CASCADE,
    CONSTRAINT uk_walk_points_seq UNIQUE (walk_id, seq)
);

-- 산책 중 남긴 사진 핀: 산책 기록을 지워도 사진 핀은 남긴다
ALTER TABLE photo_pins
    ADD CONSTRAINT fk_photo_pins_walk FOREIGN KEY (walk_id) REFERENCES walks (id) ON DELETE SET NULL;
