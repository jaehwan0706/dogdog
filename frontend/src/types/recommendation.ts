// 백엔드 RecommendationDtos 와 맞춘 타입 (맞춤 산책 시간 추천)

export type RecommendationLevel = 'GOOD' | 'FAIR' | 'POOR';
export type SkyCondition = 'CLEAR' | 'CLOUDY' | 'OVERCAST';
export type PrecipitationType = 'NONE' | 'RAIN' | 'RAIN_SNOW' | 'SNOW' | 'SHOWER';
export type AirGrade = 'GOOD' | 'MODERATE' | 'BAD' | 'VERY_BAD';

// 한 시간 단위 추천. time 은 한국 시각 정시 ("2026-11-17T19:00:00")
export type WalkTimeSlot = {
  time: string;
  score: number;
  level: RecommendationLevel;
  temperature: number | null;
  precipitationProbability: number | null;
  sky: SkyCondition | null;
  precipitation: PrecipitationType | null;
  conditionLabel: string | null;
  airGrade: AirGrade | null;
  airGradeLabel: string | null;
  // 평소 산책 시간을 날씨·미세먼지에 맞춰 줄인 권장 시간(분)
  suggestedMinutes: number;
  // 나쁜 요인 먼저, 최대 3개
  reasons: string[];
};

export type CurrentCondition = {
  headline: string;
  score: number;
  level: RecommendationLevel;
  temperature: number | null;
  conditionLabel: string | null;
  sky: SkyCondition | null;
  precipitation: PrecipitationType | null;
  pm10: number | null;
  pm25: number | null;
  airGrade: AirGrade | null;
  airGradeLabel: string | null;
  stationName: string | null;
  airMeasuredAt: string | null;
};

export type WalkHabit = {
  walkCount: number;
  usualMinutes: number;
  // 주로 산책을 시작한 시각(0~23). 기록이 3회 미만이면 빈 배열
  favoriteHours: number[];
};

export type WalkTimeRecommendation = {
  generatedAt: string;
  // true: 서버에 공공데이터 인증키가 없어 예시 날씨·미세먼지로 계산
  sample: boolean;
  weatherAvailable: boolean;
  airAvailable: boolean;
  current: CurrentCondition;
  // 좋은 순, 최대 3개
  bestSlots: WalkTimeSlot[];
  // 지금 시각(정시)부터 24시간
  hourly: WalkTimeSlot[];
  habit: WalkHabit;
};
