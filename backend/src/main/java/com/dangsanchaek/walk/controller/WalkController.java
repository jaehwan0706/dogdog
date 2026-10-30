package com.dangsanchaek.walk.controller;

import com.dangsanchaek.common.security.LoginUser;
import com.dangsanchaek.walk.dto.WalkDtos.WalkDetailResponse;
import com.dangsanchaek.walk.dto.WalkDtos.WalkEndRequest;
import com.dangsanchaek.walk.dto.WalkDtos.WalkPointsRequest;
import com.dangsanchaek.walk.dto.WalkDtos.WalkPointsResponse;
import com.dangsanchaek.walk.dto.WalkDtos.WalkResponse;
import com.dangsanchaek.walk.dto.WalkDtos.WalkStartRequest;
import com.dangsanchaek.walk.service.WalkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * 산책 기록: 시작 → 산책 중 좌표 묶음 전송(여러 번) → 종료. 시간은 서버 시각으로 기록한다.
 */
@RestController
@RequiredArgsConstructor
public class WalkController {

    private final WalkService walkService;

    /** body 생략 가능: {"dogId": 1} */
    @PostMapping("/walks/start")
    public ResponseEntity<WalkResponse> start(@LoginUser Long userId,
                                              @RequestBody(required = false) WalkStartRequest request) {
        Long dogId = request == null ? null : request.dogId();
        return ResponseEntity.status(HttpStatus.CREATED).body(walkService.start(userId, dogId));
    }

    /** 진행 중인 산책 (앱을 다시 켰을 때 이어서 하기용). 없으면 204. */
    @GetMapping("/walks/current")
    public ResponseEntity<WalkDetailResponse> current(@LoginUser Long userId) {
        WalkDetailResponse current = walkService.getCurrent(userId);
        return current == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(current);
    }

    @PostMapping("/walks/{walkId}/points")
    public WalkPointsResponse addPoints(@LoginUser Long userId, @PathVariable Long walkId,
                                        @Valid @RequestBody WalkPointsRequest request) {
        return walkService.addPoints(userId, walkId, request.points());
    }

    /** body 생략 가능: 남은 좌표가 있으면 {"points": [...]} */
    @PatchMapping("/walks/{walkId}/end")
    public WalkDetailResponse end(@LoginUser Long userId, @PathVariable Long walkId,
                                  @Valid @RequestBody(required = false) WalkEndRequest request) {
        return walkService.end(userId, walkId, request == null ? null : request.points());
    }

    @GetMapping("/walks/{walkId}")
    public WalkDetailResponse detail(@LoginUser Long userId, @PathVariable Long walkId) {
        return walkService.getDetail(userId, walkId);
    }

    @DeleteMapping("/walks/{walkId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long walkId) {
        walkService.delete(userId, walkId);
        return ResponseEntity.noContent().build();
    }

    /** 종료된 내 산책 (최신순). from·to 는 yyyy-MM-dd, 둘 다 포함. 생략하면 최근 30일. */
    @GetMapping("/users/me/walks")
    public List<WalkResponse> myWalks(@LoginUser Long userId,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return walkService.getMyWalks(userId, from, to);
    }
}
