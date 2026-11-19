import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { WalkTimeRecommendation, WalkTimeSlot } from '../../types/recommendation';

export type RecommendationService = {
  // 위치의 날씨·미세먼지와 내 산책 습관으로 앞으로 24시간 중 산책하기 좋은 시간
  getWalkTimes: (position: { latitude: number; longitude: number }, dogId?: number) => Promise<WalkTimeRecommendation>;
};

const httpRecommendationService: RecommendationService = {
  getWalkTimes: ({ latitude, longitude }, dogId) =>
    apiRequest<WalkTimeRecommendation>('/recommendations/walk-times', { query: { lat: latitude, lng: longitude, dogId } }),
};

// 서버 없이 실행할 때: 정해진 하루 기온 곡선의 예시 값
const pad = (value: number) => String(value).padStart(2, '0');
const localDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00:00`;

function mockSlot(date: Date): WalkTimeSlot {
  const hour = date.getHours();
  const temperature = Math.round(12 + 5 * Math.cos(((hour - 15) / 24) * 2 * Math.PI));
  const night = hour < 6 || hour >= 22;
  const usual = hour >= 18 && hour <= 20;
  const score = Math.max(0, Math.min(100, 84 + (usual ? 10 : 0) - (night ? 20 : 0)));
  const reasons = [
    ...(night ? ['어두운 시간이에요, 밝은 길로 다녀요'] : []),
    ...(usual ? ['평소 자주 산책하던 시간이에요'] : []),
    `기온 ${temperature}°C로 걷기 좋아요`,
    '미세먼지 좋음',
  ].slice(0, 3);
  return {
    time: localDateTime(date), score, level: score >= 75 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR',
    temperature, precipitationProbability: 10, sky: 'CLEAR', precipitation: 'NONE', conditionLabel: '맑음',
    airGrade: 'GOOD', airGradeLabel: '좋음', suggestedMinutes: 30, reasons,
  };
}

const mockRecommendationService: RecommendationService = {
  getWalkTimes: async () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const hourly = Array.from({ length: 24 }, (_, i) => mockSlot(new Date(start.getTime() + i * 3600_000)));
    const ranked = [...hourly].sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
    const bestSlots: WalkTimeSlot[] = [];
    for (const slot of ranked) {
      if (bestSlots.length >= 3) break;
      const far = bestSlots.every((p) => Math.abs(new Date(p.time).getTime() - new Date(slot.time).getTime()) >= 3 * 3600_000);
      if (far && slot.level !== 'POOR') bestSlots.push(slot);
    }
    const now = hourly[0];
    return {
      generatedAt: localDateTime(start), sample: true, weatherAvailable: true, airAvailable: true,
      current: {
        headline: '오늘은 산책하기 좋은 날이에요', score: now.score, level: now.level, temperature: now.temperature,
        conditionLabel: '맑음', sky: 'CLEAR', precipitation: 'NONE', pm10: 25, pm25: 12, airGrade: 'GOOD',
        airGradeLabel: '좋음', stationName: '예시 측정소', airMeasuredAt: localDateTime(start),
      },
      bestSlots, hourly, habit: { walkCount: 0, usualMinutes: 30, favoriteHours: [] },
    };
  },
};

export const recommendationService: RecommendationService = isMockAuth ? mockRecommendationService : httpRecommendationService;
