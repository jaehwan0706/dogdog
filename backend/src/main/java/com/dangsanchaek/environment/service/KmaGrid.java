package com.dangsanchaek.environment.service;

/**
 * 위경도 → 기상청 단기예보 격자(nx, ny) 변환 (Lambert Conformal Conic, 격자 5km).
 * 기상청 '단기예보 조회서비스' 활용가이드의 변환식을 옮긴 것.
 */
public final class KmaGrid {

    private static final double EARTH_RADIUS_KM = 6371.00877;
    private static final double GRID_KM = 5.0;
    private static final double STANDARD_LAT1 = 30.0;
    private static final double STANDARD_LAT2 = 60.0;
    private static final double ORIGIN_LNG = 126.0;
    private static final double ORIGIN_LAT = 38.0;
    private static final double ORIGIN_X = 43;
    private static final double ORIGIN_Y = 136;

    private static final double RE = EARTH_RADIUS_KM / GRID_KM;
    private static final double SN;
    private static final double SF;
    private static final double RO;

    static {
        double slat1 = Math.toRadians(STANDARD_LAT1);
        double slat2 = Math.toRadians(STANDARD_LAT2);
        double olat = Math.toRadians(ORIGIN_LAT);
        double sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        SN = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        SF = Math.pow(Math.tan(Math.PI * 0.25 + slat1 * 0.5), SN) * Math.cos(slat1) / SN;
        RO = RE * SF / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), SN);
    }

    private KmaGrid() {
    }

    public record Point(int nx, int ny) {
    }

    public static Point toGrid(double latitude, double longitude) {
        double ra = RE * SF / Math.pow(Math.tan(Math.PI * 0.25 + Math.toRadians(latitude) * 0.5), SN);
        double theta = Math.toRadians(longitude) - Math.toRadians(ORIGIN_LNG);
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= SN;
        int nx = (int) Math.floor(ra * Math.sin(theta) + ORIGIN_X + 0.5);
        int ny = (int) Math.floor(RO - ra * Math.cos(theta) + ORIGIN_Y + 0.5);
        return new Point(nx, ny);
    }

    /** 단기예보가 제공되는 대략적인 범위 (한반도·제주 주변) */
    public static boolean covers(double latitude, double longitude) {
        return latitude >= 32.5 && latitude <= 39.0 && longitude >= 124.0 && longitude <= 132.0;
    }
}
