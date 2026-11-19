package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param appKey SK open API 의 TMAP 앱 키 (보행자 경로안내). 비어 있으면 코스 거리를 직선거리로 추정한다
 */
@ConfigurationProperties("app.tmap")
public record TmapProperties(String appKey) {

    public boolean hasAppKey() {
        return appKey != null && !appKey.isBlank();
    }
}
