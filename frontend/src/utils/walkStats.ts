import type { Walk } from '../types/walk';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 기기 현지 날짜 "yyyy-MM-dd" (서버의 from·to 파라미터, startedAt 앞 10자리와 같은 형식)
export function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// 이번 주 월요일 0시
export function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

// 서버 startedAt 은 시간대 없는 현지 시각이라 앞 10자리가 곧 현지 날짜
export const walkDateKey = (walk: Walk) => walk.startedAt.slice(0, 10);

// 반려견 산책 소모 칼로리 추정: 체중(kg) × 거리(km) × 0.8. 체중을 모르면 null
export function estimateKcal(distanceMeters: number, weightKg: number | null | undefined) {
  if (!weightKg) return null;
  return Math.round(weightKg * (distanceMeters / 1000) * 0.8);
}

export type DaySummary = {
  dateKey: string;
  // 요일 한 글자 (월, 화, ...)
  day: string;
  count: number;
  distanceMeters: number;
  durationSeconds: number;
};

export function summarize(walks: Walk[]) {
  return {
    count: walks.length,
    distanceMeters: walks.reduce((total, walk) => total + walk.distanceMeters, 0),
    durationSeconds: walks.reduce((total, walk) => total + walk.durationSeconds, 0),
  };
}

// 오늘이 속한 주(월~일) 7일의 날짜별 합계
export function weekSummaries(walks: Walk[], today: Date): DaySummary[] {
  const monday = startOfWeek(today);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const dateKey = toDateKey(date);
    return { dateKey, day: DAY_LABELS[date.getDay()], ...summarize(walks.filter((walk) => walkDateKey(walk) === dateKey)) };
  });
}

// 오늘(오늘 아직 안 걸었으면 어제)부터 거꾸로 하루도 빠짐없이 산책한 날 수
export function walkStreak(walks: Walk[], today: Date) {
  const walked = new Set(walks.map(walkDateKey));
  let date = walked.has(toDateKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (walked.has(toDateKey(date))) {
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}
