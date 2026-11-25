package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * @param localDir 업로드 파일을 저장할 서버 로컬 폴더 (상대 경로면 서버 실행 위치 기준)
 * @param urlTtl   서명된 파일 URL 의 유효 시간. 지나면 목록을 다시 조회해 새 URL 을 받아야 한다
 */
@ConfigurationProperties("app.storage")
public record StorageProperties(String localDir, Duration urlTtl) {

    public StorageProperties {
        if (localDir == null || localDir.isBlank()) localDir = "uploads";
        if (urlTtl == null) urlTtl = Duration.ofHours(1);
    }
}
