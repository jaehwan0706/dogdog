package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param dataFile        도시공원 공공데이터 CSV 위치 (.gz 면 압축을 풀며 읽음). Spring Resource 경로 (classpath:, file:)
 * @param importOnStartup true 면 서버 시작 시 parks 테이블이 비어 있을 때 dataFile 을 읽어 채운다
 */
@ConfigurationProperties("app.park")
public record ParkProperties(String dataFile, Boolean importOnStartup) {

    public ParkProperties {
        if (dataFile == null || dataFile.isBlank()) dataFile = "classpath:data/city_parks.csv.gz";
        if (importOnStartup == null) importOnStartup = true;
    }
}
