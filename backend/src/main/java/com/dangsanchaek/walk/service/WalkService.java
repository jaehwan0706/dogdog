package com.dangsanchaek.walk.service;

import com.dangsanchaek.auth.domain.User;
import com.dangsanchaek.auth.domain.UserWithdrawnEvent;
import com.dangsanchaek.auth.service.UserReader;
import com.dangsanchaek.common.exception.BusinessException;
import com.dangsanchaek.common.exception.ErrorCode;
import com.dangsanchaek.dog.domain.Dog;
import com.dangsanchaek.dog.repository.DogRepository;
import com.dangsanchaek.walk.domain.Walk;
import com.dangsanchaek.walk.domain.WalkPoint;
import com.dangsanchaek.walk.domain.WalkStatus;
import com.dangsanchaek.walk.dto.WalkDtos.WalkDetailResponse;
import com.dangsanchaek.walk.dto.WalkDtos.WalkPointRequest;
import com.dangsanchaek.walk.dto.WalkDtos.WalkPointsResponse;
import com.dangsanchaek.walk.dto.WalkDtos.WalkResponse;
import com.dangsanchaek.walk.repository.WalkPointRepository;
import com.dangsanchaek.walk.repository.WalkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalkService {

    /** 산책 1회에 저장하는 최대 좌표 수 (5m 간격이면 약 100km). 넘치는 좌표는 버린다. */
    static final int MAX_POINTS_PER_WALK = 20_000;

    private final WalkRepository walkRepository;
    private final WalkPointRepository walkPointRepository;
    private final DogRepository dogRepository;
    private final UserReader userReader;

    /** 이미 진행 중인 산책이 있으면 새로 시작하지 않는다. 앱은 GET /walks/current 로 이어서 하거나 종료한다. */
    @Transactional
    public WalkResponse start(Long userId, Long dogId) {
        User owner = userReader.getActiveUser(userId);
        if (walkRepository.findFirstByOwnerIdAndStatusOrderByIdDesc(userId, WalkStatus.IN_PROGRESS).isPresent()) {
            throw new BusinessException(ErrorCode.WALK_ALREADY_IN_PROGRESS);
        }
        Dog dog = dogId == null ? null : dogRepository.findById(dogId)
                .filter(d -> d.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.DOG_NOT_FOUND));
        return WalkResponse.from(walkRepository.save(Walk.start(owner, dog, LocalDateTime.now())));
    }

    @Transactional(readOnly = true)
    public WalkDetailResponse getCurrent(Long userId) {
        return walkRepository.findFirstByOwnerIdAndStatusOrderByIdDesc(userId, WalkStatus.IN_PROGRESS)
                .map(walk -> WalkDetailResponse.of(walk, walkPointRepository.findAllByWalkIdOrderBySeqAsc(walk.getId())))
                .orElse(null);
    }

    @Transactional
    public WalkPointsResponse addPoints(Long userId, Long walkId, List<WalkPointRequest> points) {
        Walk walk = getOwnedWalk(userId, walkId);
        if (!walk.isInProgress()) throw new BusinessException(ErrorCode.WALK_ALREADY_FINISHED);
        return new WalkPointsResponse(savePoints(walk.getId(), points));
    }

    @Transactional
    public WalkDetailResponse end(Long userId, Long walkId, List<WalkPointRequest> points) {
        Walk walk = getOwnedWalk(userId, walkId);
        if (!walk.isInProgress()) throw new BusinessException(ErrorCode.WALK_ALREADY_FINISHED);
        if (points != null) savePoints(walk.getId(), points);

        List<WalkPoint> route = walkPointRepository.findAllByWalkIdOrderBySeqAsc(walk.getId());
        walk.finish(LocalDateTime.now(), (int) Math.round(Distance.routeMeters(route)));
        return WalkDetailResponse.of(walk, route);
    }

    /** from ~ to (둘 다 포함, 시작 날짜 기준) 의 종료된 산책. 생략하면 최근 30일. */
    @Transactional(readOnly = true)
    public List<WalkResponse> getMyWalks(Long userId, LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? end.minusDays(29) : from;
        if (start.isAfter(end)) throw new BusinessException(ErrorCode.INVALID_INPUT);
        return walkRepository.findAllInRange(userId, WalkStatus.FINISHED, start.atStartOfDay(),
                        end.plusDays(1).atStartOfDay()).stream()
                .map(WalkResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public WalkDetailResponse getDetail(Long userId, Long walkId) {
        Walk walk = getOwnedWalk(userId, walkId);
        return WalkDetailResponse.of(walk, walkPointRepository.findAllByWalkIdOrderBySeqAsc(walkId));
    }

    /** 진행 중인 산책 취소 / 저장된 기록 삭제 모두 이걸 쓴다. 경로 좌표는 DB 에서 함께 지워지고, 사진 핀은 남는다. */
    @Transactional
    public void delete(Long userId, Long walkId) {
        walkRepository.delete(getOwnedWalk(userId, walkId));
    }

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        walkRepository.deleteAllByOwnerId(event.userId());
    }

    /** 이미 저장된 seq 와 한 요청 안의 중복 seq 는 건너뛴다. 저장 후 마지막 seq 를 돌려준다. */
    private int savePoints(Long walkId, List<WalkPointRequest> points) {
        int lastSeq = walkPointRepository.findMaxSeq(walkId);
        long room = MAX_POINTS_PER_WALK - walkPointRepository.countByWalkId(walkId);
        List<WalkPointRequest> sorted = points.stream()
                .sorted(Comparator.comparingInt(WalkPointRequest::seq))
                .toList();
        int saved = lastSeq;
        for (WalkPointRequest p : sorted) {
            if (room <= 0) break;
            if (p.seq() <= saved) continue;
            walkPointRepository.save(new WalkPoint(walkId, p.seq(), p.latitude(), p.longitude()));
            saved = p.seq();
            room--;
        }
        return saved;
    }

    /** 다른 사람의 산책은 존재 여부도 노출하지 않도록 404 로 응답한다. */
    private Walk getOwnedWalk(Long userId, Long walkId) {
        return walkRepository.findById(walkId)
                .filter(walk -> walk.isOwnedBy(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.WALK_NOT_FOUND));
    }
}
