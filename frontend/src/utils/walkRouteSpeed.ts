import type { WalkPoint } from '../types/walk';
import { distanceMeters } from './geo';

export const WALK_SPEED_BANDS = [
  { max: 3, color: '#238448', label: '<3' },
  { max: 5, color: '#F5D629', label: '3–<5' },
  { max: 7, color: '#FF942D', label: '5–<7' },
  { max: Infinity, color: '#EC4640', label: '≥7' },
];

export type RouteSpeedSegment = { start: number; end: number; color: string };
export const ROUTE_UNKNOWN_SPEED_COLOR = '#D7DFDB';

export function walkRouteSpeedSegments(route: WalkPoint[]): RouteSpeedSegment[] {
  const segments: RouteSpeedSegment[] = [];
  let averageSpeed: number | undefined;
  let hasSpeed = false;

  for (let index = 1; index < route.length; index += 1) {
    const previousPoint = route[index - 1];
    const point = route[index];
    const seconds = ((point.recordedAtMs ?? NaN) - (previousPoint.recordedAtMs ?? NaN)) / 1000;
    let color = ROUTE_UNKNOWN_SPEED_COLOR;

    if (seconds > 0 && seconds <= 60 && point.seq === previousPoint.seq + 1) {
      const speed = (distanceMeters(previousPoint, point) / seconds) * 3.6;
      // GPS 수집 간격이 달라도 약 6초에 걸쳐 속도 변화가 반영되도록 한다.
      const weight = 1 - Math.exp(-seconds / 6);
      averageSpeed = averageSpeed === undefined ? speed : averageSpeed + weight * (speed - averageSpeed);
      const smoothedSpeed = averageSpeed;
      color = (WALK_SPEED_BANDS.find(({ max }) => smoothedSpeed < max) ?? WALK_SPEED_BANDS[3]).color;
      hasSpeed = true;
    } else {
      averageSpeed = undefined;
    }

    const previous = segments[segments.length - 1];
    if (previous?.color === color) {
      previous.end = index + 1;
    } else {
      segments.push({ start: index - 1, end: index + 1, color });
    }
  }

  return hasSpeed ? segments : [];
}
