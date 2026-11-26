import { useEffect, useRef, useState } from 'react';
import { FACILITY_MAX_SPAN, facilityService } from '../api/facility/facilityService';
import type { MapViewport } from '../components/map/naverMapCommon';
import type { FacilityCategory, FacilitySummary } from '../types/facility';
import { distanceMeters } from '../utils/geo';

// 이보다 멀리서 보면(축소) 시설이 너무 많아 조회하지 않고 "확대해 주세요" 안내
const MIN_FACILITY_ZOOM = 13;
// 지도를 움직이는 동안 매번 조회하지 않도록, 멈춘 뒤 이만큼 기다렸다가 조회
const FACILITY_FETCH_DELAY_MS = 300;

export type FacilityNotice = 'zoomIn' | 'truncated' | 'error' | null;

export const FACILITY_NOTICE_TEXT: Record<Exclude<FacilityNotice, null>, string> = {
  zoomIn: '지도를 확대하면 친화시설이 보여요',
  truncated: '가까운 시설만 보여요 · 확대하면 더 보여요',
  error: '친화시설을 불러오지 못했어요',
};

type Options = {
  // false 면 조회하지 않고 목록을 비움
  enabled: boolean;
  // 지도가 마지막으로 멈춘 범위 (onCameraIdle)
  viewport: MapViewport | null;
  categories?: FacilityCategory[];
  // 0 보다 크면: 지도 가운데가 이만큼(m) 움직이거나 확대 단계가 바뀌었을 때만 다시 조회한다.
  // 산책 중에는 지도가 내 위치를 따라 계속 움직여서, 멈출 때마다 조회하면 걸음마다 요청이 간다
  refetchDistanceMeters?: number;
  // 보이는 범위보다 한 변마다 이 비율만큼 넓게 조회 (조금 움직여도 가장자리 시설이 비지 않게)
  padding?: number;
};

const centerOf = ({ swLat, swLng, neLat, neLng }: MapViewport) => ({
  latitude: (swLat + neLat) / 2,
  longitude: (swLng + neLng) / 2,
});

// 지도에 보이는 범위 안의 친화시설을 불러온다 (지도 탭·산책 화면 공용)
export function useFacilitiesInView({ enabled, viewport, categories, refetchDistanceMeters = 0, padding = 0 }: Options) {
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<FacilityNotice>(null);
  const requestId = useRef(0);
  // 마지막으로 조회한 범위와 분류 (refetchDistanceMeters 비교용)
  const lastFetched = useRef<{ viewport: MapViewport; categoryKey: string } | null>(null);
  const categoryKey = categories?.join(',') ?? '';

  useEffect(() => {
    if (!enabled || !viewport) {
      ++requestId.current;
      lastFetched.current = null;
      setFacilities([]);
      setNotice(null);
      setLoading(false);
      return;
    }
    const { zoom, ...bounds } = viewport;
    if (zoom < MIN_FACILITY_ZOOM || bounds.neLat - bounds.swLat > FACILITY_MAX_SPAN || bounds.neLng - bounds.swLng > FACILITY_MAX_SPAN) {
      ++requestId.current;
      lastFetched.current = null;
      setFacilities([]);
      setNotice('zoomIn');
      setLoading(false);
      return;
    }
    const last = lastFetched.current;
    if (
      refetchDistanceMeters > 0 &&
      last &&
      last.categoryKey === categoryKey &&
      Math.round(last.viewport.zoom) === Math.round(zoom) &&
      distanceMeters(centerOf(last.viewport), centerOf(viewport)) < refetchDistanceMeters
    ) {
      return;
    }

    const id = ++requestId.current;
    const latPad = (bounds.neLat - bounds.swLat) * padding;
    const lngPad = (bounds.neLng - bounds.swLng) * padding;
    const query = {
      swLat: bounds.swLat - latPad,
      swLng: bounds.swLng - lngPad,
      neLat: bounds.neLat + latPad,
      neLng: bounds.neLng + lngPad,
    };
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await facilityService.getInBounds(query, categories);
        // 그 사이 지도를 또 움직였으면 이 응답은 버림
        if (id !== requestId.current) return;
        lastFetched.current = { viewport, categoryKey };
        setFacilities(result.facilities);
        setNotice(result.truncated ? 'truncated' : null);
      } catch {
        if (id === requestId.current) setNotice('error');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, FACILITY_FETCH_DELAY_MS);
    return () => clearTimeout(timer);
    // categories 는 매번 새 배열일 수 있어 내용(categoryKey)으로 비교
  }, [enabled, viewport, categoryKey, refetchDistanceMeters, padding]);

  return { facilities, loading, notice };
}
