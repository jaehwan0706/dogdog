package com.dangsanchaek.common.csv;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.Resource;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.zip.GZIPInputStream;

/** 공공데이터 CSV(UTF-8, 첫 줄 헤더, .gz 가능) 읽기 도우미. 시설·공원 데이터 적재에서 같이 쓴다 */
public final class PublicDataCsv {

    private PublicDataCsv() {
    }

    /** 다 읽은 뒤 닫아야 한다 (try-with-resources) */
    public static CSVParser open(Resource resource) throws IOException {
        InputStream raw = new BufferedInputStream(resource.getInputStream());
        String name = resource.getFilename();
        InputStream in = name != null && name.endsWith(".gz") ? new GZIPInputStream(raw) : raw;
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        return format.parse(new InputStreamReader(skipBom(in), StandardCharsets.UTF_8));
    }

    /** 열이 없거나 비어 있으면 "" (앞뒤 공백 제거) */
    public static String get(CSVRecord record, String column) {
        return record.isMapped(column) && record.isSet(column) ? record.get(column).trim() : "";
    }

    public static Double number(String value) {
        try {
            return value == null || value.isEmpty() ? null : Double.valueOf(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** yyyy-MM-dd */
    public static Date date(String value) {
        try {
            return value == null || value.isEmpty() ? null : Date.valueOf(LocalDate.parse(value));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /** UTF-8 BOM(EF BB BF) 이 있으면 건너뛴다 (없으면 첫 헤더 이름에 붙어 첫 열을 못 찾음) */
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
