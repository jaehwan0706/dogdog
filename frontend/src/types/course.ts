// 백엔드 CourseDtos 와 맞춘 타입 (맞춤 산책 코스)
import type { FacilityCategory } from './facility';

// PARK: 공원까지 다녀오기 (공공데이터 도시공원) / MY_ROUTE: 내가 전에 걸었던 경로
export type CourseType = 'PARK' | 'MY_ROUTE';

export type CourseNearbyFacility = {
  id: number;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  distanceMeters: number;
};

export type Course = {
  // 목록 안에서 구분하는 값 ("park-12", "walk-34")
  id: string;
  type: CourseType;
  title: string;
  subtitle: string;
  // 목적지 (공원 위치 / 내 경로에서 출발점과 가장 먼 지점)
  latitude: number;
  longitude: number;
  // 왕복 예상 거리 (공원은 직선거리로 추정, 내 경로는 실제 기록)
  distanceMeters: number;
  estimatedMinutes: number;
  score: number;
  reasons: string[];
  parkId: number | null;
  walkId: number | null;
  address: string | null;
  areaSquareMeters: number | null;
  // 편익시설 (화장실, 음수대 등)
  convenience: string | null;
  nearbyFacilities: CourseNearbyFacility[];
  // 내 경로의 좌표 (공원은 빈 배열)
  path: { latitude: number; longitude: number }[];
};

export type CourseRecommendation = {
  targetMinutes: number;
  targetMeters: number;
  paceMetersPerMinute: number;
  // 점수 높은 순 (공원 최대 3개 + 내 경로 최대 2개)
  courses: Course[];
};
