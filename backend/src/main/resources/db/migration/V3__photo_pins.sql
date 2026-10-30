-- ---------------------------------------------------------------------
-- 사진 핀 (PhotoPin) : 지도 위 위치에 사진 1장을 남기는 비공개 개인 기록
--   image_key : 파일 저장소 안의 경로 (예: photo-pins/3f2a....jpg). URL 은 응답 시 서명해서 만든다
--   walk_id   : 산책 중 남긴 핀이면 산책 ID. 산책(walks) 테이블이 생기면 FK 를 추가한다
-- ---------------------------------------------------------------------
CREATE TABLE photo_pins (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    walk_id    BIGINT       NULL,
    latitude   DOUBLE       NOT NULL,
    longitude  DOUBLE       NOT NULL,
    image_key  VARCHAR(200) NOT NULL,
    memo       VARCHAR(200) NULL,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    CONSTRAINT pk_photo_pins PRIMARY KEY (id),
    CONSTRAINT fk_photo_pins_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_photo_pins_user ON photo_pins (user_id, id);
