package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param dataFile        시설 공공데이터 CSV 위치 (.gz 면 압축을 풀며 읽음). Spring Resource 경로 (classpath:, file:)
 * @param importOnStartup true 면 서버 시작 시 facilities 테이블이 비어 있을 때 dataFile 을 읽어 채운다
 */
@ConfigurationProperties("app.facility")
public record FacilityProperties(String dataFile, Boolean importOnStartup) {

    public FacilityProperties {
        if (dataFile == null || dataFile.isBlank()) dataFile = "classpath:data/pet_facilities.csv.gz";
        if (importOnStartup == null) importOnStartup = true;
    }
}
