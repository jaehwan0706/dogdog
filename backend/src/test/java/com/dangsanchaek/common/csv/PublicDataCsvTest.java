package com.dangsanchaek.common.csv;

import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

/** 실제로 커밋된 공공데이터 파일(.gz)이 깨지지 않고 끝까지 읽히는지 */
class PublicDataCsvTest {

    @ParameterizedTest
    @CsvSource({
            "data/city_parks.csv.gz, 공원명, 18000",
            "data/pet_facilities.csv.gz, 시설명, 70000",
    })
    void 공공데이터_파일을_끝까지_읽는다(String path, String firstColumn, int minRows) throws Exception {
        int rows = 0;
        try (CSVParser parser = PublicDataCsv.open(new ClassPathResource(path))) {
            assertThat(parser.getHeaderNames()).contains(firstColumn);
            for (CSVRecord ignored : parser) rows++;
        }
        assertThat(rows).isGreaterThan(minRows);
    }
}
