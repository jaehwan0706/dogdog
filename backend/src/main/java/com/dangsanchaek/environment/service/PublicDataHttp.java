package com.dangsanchaek.environment.service;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 공공데이터포털(apis.data.go.kr) 호출. 응답 형식: {"response":{"header":{"resultCode":"00",...},"body":{...}}}
 * 인증키 오류 등은 dataType=JSON 이어도 XML 로 오므로 JSON 이 아니면 실패로 본다.
 */
class PublicDataHttp {

    static class PublicDataException extends RuntimeException {
        PublicDataException(String message) {
            super(message);
        }
    }

    private final RestClient client;
    private final String encodedServiceKey;
    private final JsonMapper mapper = JsonMapper.builder().build();

    PublicDataHttp(String serviceKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(6));
        this.client = RestClient.builder().requestFactory(factory).build();
        // 포털은 Encoding/Decoding 두 가지 키를 준다. 이미 인코딩된 키(% 포함)는 그대로 쓴다
        this.encodedServiceKey = serviceKey.contains("%") ? serviceKey : encode(serviceKey);
    }

    /** body 노드를 돌려준다. 요청 URI 에 인증키가 들어 있으므로 예외 메시지에 URI 를 넣지 않는다 */
    JsonNode get(String url, Map<String, String> params) {
        String query = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + encode(e.getValue()))
                .collect(Collectors.joining("&"));
        String body = client.get()
                .uri(URI.create(url + "?serviceKey=" + encodedServiceKey + "&" + query))
                .retrieve()
                .body(String.class);
        if (body == null || !body.stripLeading().startsWith("{")) {
            throw new PublicDataException("JSON 이 아닌 응답: " + snippet(body));
        }
        JsonNode response = mapper.readTree(body).path("response");
        JsonNode header = response.path("header");
        String resultCode = header.path("resultCode").asString("");
        if (!"00".equals(resultCode)) {
            throw new PublicDataException("resultCode=" + resultCode + " " + header.path("resultMsg").asString(""));
        }
        return response.path("body");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String snippet(String body) {
        if (body == null) return "(빈 응답)";
        String oneLine = body.replaceAll("\\s+", " ");
        return oneLine.length() > 200 ? oneLine.substring(0, 200) : oneLine;
    }
}
