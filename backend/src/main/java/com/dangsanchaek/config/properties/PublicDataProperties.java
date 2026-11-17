package com.dangsanchaek.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 공공데이터포털(data.go.kr) 설정.
 *
 * @param serviceKey 일반 인증키 (Encoding·Decoding 아무거나). 기상청 단기예보·에어코리아 대기오염정보·측정소정보를
 *                   이 계정으로 활용신청해 두어야 한다. 비어 있으면 예시 날씨·미세먼지를 쓴다
 */
@ConfigurationProperties("app.public-data")
public record PublicDataProperties(String serviceKey) {

    public boolean hasServiceKey() {
        return serviceKey != null && !serviceKey.isBlank();
    }
}
