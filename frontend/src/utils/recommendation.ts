import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AirGrade, PrecipitationType, RecommendationLevel, SkyCondition } from '../types/recommendation';
import { colors } from '../theme';
import { toDateKey } from './walkStats';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// "2026-11-17T19:00:00" (한국 시각) → 시
const slotHour = (time: string) => Number(time.slice(11, 13));

export function hourLabel(hour: number) {
  if (hour === 0) return '밤 12시';
  if (hour === 12) return '낮 12시';
  return hour < 12 ? `오전 ${hour}시` : `오후 ${hour - 12}시`;
}

// "지금" / "오후 7시" / "내일 오전 7시"
export function slotLabel(time: string, isFirst = false) {
  if (isFirst) return '지금';
  const today = toDateKey(new Date());
  const prefix = time.slice(0, 10) > today ? '내일 ' : '';
  return prefix + hourLabel(slotHour(time));
}

export function conditionIcon(sky: SkyCondition | null, precipitation: PrecipitationType | null, time?: string): IconName {
  switch (precipitation) {
    case 'RAIN': return 'weather-rainy';
    case 'RAIN_SNOW': return 'weather-snowy-rainy';
    case 'SNOW': return 'weather-snowy';
    case 'SHOWER': return 'weather-pouring';
    default: break;
  }
  const hour = time ? slotHour(time) : new Date().getHours();
  const night = hour < 6 || hour >= 19;
  switch (sky) {
    case 'CLEAR': return night ? 'weather-night' : 'white-balance-sunny';
    case 'CLOUDY': return night ? 'weather-night-partly-cloudy' : 'weather-partly-cloudy';
    case 'OVERCAST': return 'weather-cloudy';
    default: return 'thermometer';
  }
}

export const AIR_GRADE_COLOR: Record<AirGrade, string> = {
  GOOD: '#3D7DD8',
  MODERATE: colors.success,
  BAD: colors.orange,
  VERY_BAD: colors.danger,
};

export const LEVEL_COLOR: Record<RecommendationLevel, string> = {
  GOOD: colors.forest,
  FAIR: colors.orange,
  POOR: colors.inkFaint,
};

export const formatTemperature = (value: number | null) => (value === null ? '-' : `${Math.round(value)}°C`);
