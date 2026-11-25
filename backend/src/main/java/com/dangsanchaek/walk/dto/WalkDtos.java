package com.dangsanchaek.walk.dto;

import com.dangsanchaek.walk.domain.Walk;
import com.dangsanchaek.walk.domain.WalkPoint;
import com.dangsanchaek.walk.domain.WalkStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class WalkDtos {

    /** 한 번에 보낼 수 있는 좌표 수. 앱은 산책 중 30초 정도마다 모아서 보낸다. */
    public static final int MAX_POINTS_PER_REQUEST = 500;

    private WalkDtos() {
    }

    /** dogId 가 없으면 반려견 없이 기록한다. */
    public record WalkStartRequest(Long dogId) {
    }

    /** seq 는 산책마다 0부터 1씩 늘리는 순번. 이미 받은 seq 는 무시하므로 실패한 묶음을 그대로 재전송해도 된다. */
    public record WalkPointRequest(
            @NotNull(message = "순번을 입력해 주세요.") @Min(0) Integer seq,
            @NotNull(message = "위도를 입력해 주세요.")
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @NotNull(message = "경도를 입력해 주세요.")
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude
    ) {
    }

    public record WalkPointsRequest(
            @NotNull(message = "좌표 목록을 입력해 주세요.")
            @Size(max = MAX_POINTS_PER_REQUEST, message = "좌표는 한 번에 500개까지 보낼 수 있습니다.")
            List<@Valid WalkPointRequest> points
    ) {
    }

    /** 종료 직전까지 아직 보내지 못한 좌표가 있으면 함께 보낸다. */
    public record WalkEndRequest(
            @Size(max = MAX_POINTS_PER_REQUEST, message = "좌표는 한 번에 500개까지 보낼 수 있습니다.")
            List<@Valid WalkPointRequest> points
    ) {
    }

    /** 서버에 저장된 마지막 순번 (좌표가 없으면 -1). 앱은 이 다음 순번부터 보내면 된다. */
    public record WalkPointsResponse(int lastSeq) {
    }

    public record WalkResponse(
            Long id,
            Long dogId,
            String dogName,
            WalkStatus status,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            int distanceMeters,
            int durationSeconds
    ) {
        public static WalkResponse from(Walk walk) {
            return new WalkResponse(walk.getId(),
                    walk.getDog() == null ? null : walk.getDog().getId(),
                    walk.getDog() == null ? null : walk.getDog().getName(),
                    walk.getStatus(), walk.getStartedAt(), walk.getEndedAt(),
                    walk.getDistanceMeters(), walk.getDurationSeconds());
        }
    }

    public record WalkPointResponse(int seq, double latitude, double longitude) {
        public static WalkPointResponse from(WalkPoint point) {
            return new WalkPointResponse(point.getSeq(), point.getLatitude(), point.getLongitude());
        }
    }

    /** 산책 상세: 요약 + 경로 전체 (seq 순). */
    public record WalkDetailResponse(
            Long id,
            Long dogId,
            String dogName,
            WalkStatus status,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            int distanceMeters,
            int durationSeconds,
            List<WalkPointResponse> points
    ) {
        public static WalkDetailResponse of(Walk walk, List<WalkPoint> points) {
            WalkResponse w = WalkResponse.from(walk);
            return new WalkDetailResponse(w.id(), w.dogId(), w.dogName(), w.status(), w.startedAt(), w.endedAt(),
                    w.distanceMeters(), w.durationSeconds(), points.stream().map(WalkPointResponse::from).toList());
        }
    }
}
