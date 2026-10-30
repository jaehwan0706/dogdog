import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { walkService } from '../api/walk/walkService';
import type { WalkDetail, WalkPoint } from '../types/walk';
import { distanceMeters, routeMeters } from '../utils/geo';
import type { Coordinate } from './useCurrentLocation';

// 이 간격마다 모아 둔 좌표를 서버에 보낸다. 앱이 꺼져도 그 전까지의 경로는 서버에 남는다
const FLUSH_INTERVAL_MS = 30_000;
// 서버가 한 번에 받는 최대 좌표 수 (WalkDtos.MAX_POINTS_PER_REQUEST)
const MAX_POINTS_PER_REQUEST = 500;
// 오차가 이보다 큰 위치는 경로가 튀므로 버린다 (실내·건물 사이 등)
const MAX_ACCURACY_METERS = 30;
// 이보다 가까운 위치는 제자리 흔들림으로 보고 버린다
const MIN_STEP_METERS = 3;

export type RecorderPhase = 'preparing' | 'recording' | 'ending' | 'failed';

/**
 * 산책 1회 기록. enabled(위치 권한 허용)가 되면 진행 중인 산책을 이어받거나 새로 시작하고,
 * 받은 위치를 경로에 쌓아 30초마다 서버로 보낸다. 거리·시간의 최종 값은 종료 시 서버가 계산한다.
 */
export function useWalkRecorder({ enabled, location, dogId }: { enabled: boolean; location: Coordinate | null; dogId?: number }) {
  const [phase, setPhase] = useState<RecorderPhase>('preparing');
  const [error, setError] = useState<string | null>(null);
  const [walkId, setWalkId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [resumed, setResumed] = useState(false);
  const [route, setRoute] = useState<WalkPoint[]>([]);
  const [now, setNow] = useState(Date.now());

  // 화면에 그릴 필요 없는 값은 ref 로 (바뀔 때마다 다시 그리지 않도록)
  const pending = useRef<WalkPoint[]>([]);
  const nextSeq = useRef(0);
  const lastPoint = useRef<WalkPoint | null>(null);
  const flushing = useRef(false);

  const begin = useCallback((walk: WalkDetail, isResumed: boolean) => {
    setWalkId(walk.id);
    // 서버 시각은 시간대 없는 현지 시각이라 Date.parse 가 기기 현지 시각으로 해석한다
    setStartedAt(Date.parse(walk.startedAt));
    setRoute(walk.points);
    setResumed(isResumed);
    lastPoint.current = walk.points.at(-1) ?? null;
    nextSeq.current = (walk.points.at(-1)?.seq ?? -1) + 1;
    pending.current = [];
    setPhase('recording');
  }, []);

  const prepare = useCallback(async () => {
    setPhase('preparing');
    setError(null);
    try {
      // 앱이 꺼졌다 켜졌으면 진행 중인 산책을 이어서 기록한다
      const current = await walkService.getCurrent();
      if (current) {
        begin(current, true);
        return;
      }
      const started = await walkService.start(dogId);
      begin({ ...started, points: [] }, false);
    } catch (e) {
      // 다른 기기 등에서 그 사이에 시작했으면 그 산책을 이어받는다
      if (e instanceof ApiError && e.code === 'WALK_ALREADY_IN_PROGRESS') {
        const current = await walkService.getCurrent().catch(() => null);
        if (current) {
          begin(current, true);
          return;
        }
      }
      setError(e instanceof Error ? e.message : '산책을 시작하지 못했어요.');
      setPhase('failed');
    }
  }, [begin, dogId]);

  useEffect(() => {
    if (enabled) prepare();
  }, [enabled, prepare]);

  // 새 위치를 경로에 추가
  useEffect(() => {
    if (phase !== 'recording' || !location) return;
    if (location.accuracy !== null && location.accuracy > MAX_ACCURACY_METERS) return;
    if (lastPoint.current && distanceMeters(lastPoint.current, location) < MIN_STEP_METERS) return;
    const point: WalkPoint = { seq: nextSeq.current++, latitude: location.latitude, longitude: location.longitude };
    lastPoint.current = point;
    pending.current.push(point);
    setRoute((current) => [...current, point]);
  }, [phase, location]);

  // 모아 둔 좌표 전송. 실패하면 남겨 두고 다음에 다시 보낸다 (서버가 seq 로 중복을 걸러줌)
  const flush = useCallback(async (keepLast = 0) => {
    if (!walkId || flushing.current) return;
    flushing.current = true;
    try {
      while (pending.current.length > keepLast) {
        const batch = pending.current.slice(0, Math.min(MAX_POINTS_PER_REQUEST, pending.current.length - keepLast));
        await walkService.addPoints(walkId, batch);
        // 성공했으면 서버가 받았거나(또는 좌표 상한이라 버렸거나) 둘 중 하나라 다시 보낼 필요가 없다
        const sentSeq = batch[batch.length - 1].seq;
        pending.current = pending.current.filter((point) => point.seq > sentSeq);
      }
    } finally {
      flushing.current = false;
    }
  }, [walkId]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => {
      flush().catch(() => {});
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phase, flush]);

  // 경과 시간 표시용 1초 타이머
  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // 종료: 500개를 넘는 남은 좌표는 먼저 보내고, 마지막 묶음은 종료 요청에 함께 싣는다
  const end = useCallback(async (): Promise<WalkDetail | null> => {
    if (!walkId) return null;
    setPhase('ending');
    try {
      await flush(MAX_POINTS_PER_REQUEST);
      const finished = await walkService.end(walkId, pending.current);
      pending.current = [];
      return finished;
    } catch (e) {
      setPhase('recording');
      throw e;
    }
  }, [walkId, flush]);

  const cancel = useCallback(async () => {
    if (!walkId) return;
    setPhase('ending');
    try {
      await walkService.remove(walkId);
    } catch (e) {
      setPhase('recording');
      throw e;
    }
  }, [walkId]);

  // 화면 표시용 거리 (저장되는 값은 종료 시 서버가 계산)
  const liveDistance = useMemo(() => routeMeters(route), [route]);

  return {
    phase,
    error,
    walkId,
    resumed,
    route,
    distanceMeters: liveDistance,
    elapsedSeconds: startedAt ? Math.max(0, (now - startedAt) / 1000) : 0,
    retry: prepare,
    end,
    cancel,
  };
}
