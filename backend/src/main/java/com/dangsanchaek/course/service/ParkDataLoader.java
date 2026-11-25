package com.dangsanchaek.course.service;

import com.dangsanchaek.common.csv.PublicDataCsv;
import com.dangsanchaek.config.properties.ParkProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 서버 시작 시 parks 테이블이 비어 있으면 도시공원 공공데이터 CSV 를 읽어 채운다.
 * <p>
 * 원본: 전국도시공원정보표준데이터 (공공데이터포털 15012890, 약 1.8만 행).
 * (공원명, 위도, 경도) 가 같은 행, 좌표가 국내 범위를 벗어난 행, 묘지공원은 넣지 않는다.
 * 데이터를 새로 받으면 파일을 바꾸고 테이블을 비운 뒤 재시작한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ParkDataLoader implements ApplicationRunner {

    private static final int BATCH_SIZE = 1000;
    private static final Set<String> EXCLUDED_TYPES = Set.of("묘지공원");
    private static final List<String> AMENITY_COLUMNS = List.of(
            "공원보유시설(운동시설)", "공원보유시설(유희시설)", "공원보유시설(교양시설)", "공원보유시설(기타시설)");

    private static final String INSERT_SQL = """
            INSERT INTO parks (name, park_type, latitude, longitude, area_m2, road_address, lot_address,
                convenience, amenities, source_updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final ParkProperties properties;
    private final ResourceLoader resourceLoader;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (!properties.importOnStartup()) {
            return;
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM parks", Long.class);
        if (count != null && count > 0) {
            return;
        }
        Resource resource = resourceLoader.getResource(properties.dataFile());
        if (!resource.exists()) {
            log.warn("공원 데이터 파일이 없어 가져오지 않습니다: {}", properties.dataFile());
            return;
        }
        long started = System.currentTimeMillis();
        List<Object[]> rows = readRows(resource);
        transactionTemplate.executeWithoutResult(status -> {
            for (int from = 0; from < rows.size(); from += BATCH_SIZE) {
                jdbcTemplate.batchUpdate(INSERT_SQL, rows.subList(from, Math.min(from + BATCH_SIZE, rows.size())));
            }
        });
        log.info("공원 데이터 {}건을 가져왔습니다 ({}ms, {})", rows.size(), System.currentTimeMillis() - started,
                properties.dataFile());
    }

    private List<Object[]> readRows(Resource resource) throws IOException {
        List<Object[]> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        try (CSVParser parser = PublicDataCsv.open(resource)) {
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
        String name = text(r, "공원명", 100);
        String type = text(r, "공원구분", 30);
        Double latitude = PublicDataCsv.number(PublicDataCsv.get(r, "위도"));
        Double longitude = PublicDataCsv.number(PublicDataCsv.get(r, "경도"));
        if (name == null || type == null || latitude == null || longitude == null
                || EXCLUDED_TYPES.contains(type) || !inKorea(latitude, longitude)) {
            return Optional.empty();
        }
        Double area = PublicDataCsv.number(PublicDataCsv.get(r, "공원면적"));
        String amenities = AMENITY_COLUMNS.stream()
                .map(column -> PublicDataCsv.get(r, column))
                .filter(value -> !value.isEmpty())
                .collect(Collectors.joining(", "));
        return Optional.of(new Object[]{
                name, type, latitude, longitude, area != null && area > 0 ? area : null,
                text(r, "소재지도로명주소", 200), text(r, "소재지지번주소", 200),
                text(r, "공원보유시설(편익시설)", 300), truncate(amenities, 500),
                PublicDataCsv.date(PublicDataCsv.get(r, "데이터기준일자")),
        });
    }

    private static boolean inKorea(double latitude, double longitude) {
        return latitude >= 32.5 && latitude <= 39.0 && longitude >= 124.0 && longitude <= 132.0;
    }

    private static String text(CSVRecord record, String column, int maxLength) {
        return truncate(PublicDataCsv.get(record, column), maxLength);
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.isEmpty()) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
