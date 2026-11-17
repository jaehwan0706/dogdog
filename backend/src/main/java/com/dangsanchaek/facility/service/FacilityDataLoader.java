package com.dangsanchaek.facility.service;

import com.dangsanchaek.config.properties.FacilityProperties;
import com.dangsanchaek.facility.domain.FacilityCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.zip.GZIPInputStream;

/**
 * 서버 시작 시 facilities 테이블이 비어 있으면 공공데이터 CSV 를 읽어 채운다.
 * <p>
 * 원본: 한국문화정보원_전국 반려동물 동반 가능 문화시설 위치 데이터 (공공데이터포털 15111389, UTF-8 BOM, 약 7만 행).
 * 원본에는 완전히 같은 행이 여러 번 들어 있어 (시설명, 위도, 경도) 로 중복을 걸러내고,
 * '반려동물 동반 가능정보' 가 Y 인 시설만 넣는다. 데이터를 새로 받으면 파일을 바꾸고 테이블을 비운 뒤 재시작한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FacilityDataLoader implements ApplicationRunner {

    private static final int BATCH_SIZE = 1000;
    private static final Set<String> EMPTY_VALUES = Set.of("", "정보없음", "해당없음");

    private static final String INSERT_SQL = """
            INSERT INTO facilities (name, category, latitude, longitude, road_address, lot_address, phone, homepage,
                closed_days, opening_hours, parking, indoor, outdoor, pet_size, pet_restrictions, pet_extra_fee,
                entrance_fee, description, source_updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final FacilityProperties properties;
    private final ResourceLoader resourceLoader;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (!properties.importOnStartup()) {
            return;
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM facilities", Long.class);
        if (count != null && count > 0) {
            return;
        }
        Resource resource = resourceLoader.getResource(properties.dataFile());
        if (!resource.exists()) {
            log.warn("시설 데이터 파일이 없어 가져오지 않습니다: {}", properties.dataFile());
            return;
        }
        long started = System.currentTimeMillis();
        List<Object[]> rows = readRows(resource);
        // 도중에 실패하면 전부 되돌려서 "일부만 들어간 채로 다시는 안 채워지는" 상태를 막는다
        transactionTemplate.executeWithoutResult(status -> {
            for (int from = 0; from < rows.size(); from += BATCH_SIZE) {
                jdbcTemplate.batchUpdate(INSERT_SQL, rows.subList(from, Math.min(from + BATCH_SIZE, rows.size())));
            }
        });
        log.info("시설 데이터 {}건을 가져왔습니다 ({}ms, {})", rows.size(), System.currentTimeMillis() - started,
                properties.dataFile());
    }

    private List<Object[]> readRows(Resource resource) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        List<Object[]> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        try (InputStream raw = new BufferedInputStream(resource.getInputStream());
             InputStream in = isGzip(resource) ? new GZIPInputStream(raw) : raw;
             Reader reader = new InputStreamReader(skipBom(in), StandardCharsets.UTF_8);
             CSVParser parser = format.parse(reader)) {
            for (CSVRecord record : parser) {
                toRow(record).ifPresent(row -> {
                    String key = row[0] + "|" + row[2] + "|" + row[3];
                    if (seen.add(key)) rows.add(row);
                });
            }
        }
        return rows;
    }

    private Optional<Object[]> toRow(CSVRecord r) {
        if (!"Y".equals(get(r, "반려동물 동반 가능정보"))) {
            return Optional.empty();
        }
        Optional<FacilityCategory> category = FacilityCategory.fromSourceName(get(r, "카테고리3"));
        String name = text(r, "시설명", 100);
        Double latitude = number(get(r, "위도"));
        Double longitude = number(get(r, "경도"));
        if (category.isEmpty() || name == null || latitude == null || longitude == null) {
            return Optional.empty();
        }
        return Optional.of(new Object[]{
                name, category.get().name(), latitude, longitude,
                text(r, "도로명주소", 200), text(r, "지번주소", 200), text(r, "전화번호", 30),
                text(r, "홈페이지", 500), text(r, "휴무일", 100), text(r, "운영시간", 200),
                yesNo(get(r, "주차 가능여부")), yesNo(get(r, "장소(실내) 여부")), yesNo(get(r, "장소(실외)여부")),
                text(r, "입장 가능 동물 크기", 100), text(r, "반려동물 제한사항", 200),
                text(r, "애견 동반 추가 요금", 100), text(r, "입장(이용료)가격 정보", 100),
                text(r, "기본 정보_장소설명", 200), date(get(r, "최종작성일")),
        });
    }

    private static String get(CSVRecord record, String column) {
        return record.isMapped(column) && record.isSet(column) ? record.get(column).trim() : "";
    }

    /** 빈 값·"정보없음" 등은 null, 너무 길면 자른다 */
    private static String text(CSVRecord record, String column, int maxLength) {
        String value = get(record, column);
        if (EMPTY_VALUES.contains(value)) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private static Boolean yesNo(String value) {
        return switch (value) {
            case "Y" -> Boolean.TRUE;
            case "N" -> Boolean.FALSE;
            default -> null;
        };
    }

    private static Double number(String value) {
        try {
            return value.isEmpty() ? null : Double.valueOf(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Date date(String value) {
        try {
            return value.isEmpty() ? null : Date.valueOf(LocalDate.parse(value));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static boolean isGzip(Resource resource) {
        String name = resource.getFilename();
        return name != null && name.endsWith(".gz");
    }

    /** UTF-8 BOM(EF BB BF) 이 있으면 건너뛴다 (없으면 첫 헤더 이름에 붙어 "시설명" 을 못 찾음) */
    private static InputStream skipBom(InputStream in) throws IOException {
        InputStream buffered = in.markSupported() ? in : new BufferedInputStream(in);
        buffered.mark(3);
        byte[] head = buffered.readNBytes(3);
        if (!(head.length == 3 && (head[0] & 0xFF) == 0xEF && (head[1] & 0xFF) == 0xBB && (head[2] & 0xFF) == 0xBF)) {
            buffered.reset();
        }
        return buffered;
    }
}
