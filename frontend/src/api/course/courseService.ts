import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { Course, CourseRecommendation } from '../../types/course';
import { distanceMeters } from '../../utils/geo';

export type CourseService = {
  // minutes: 목표 산책 시간 (보통 추천 시간대의 권장 시간). 생략하면 서버가 평소 산책 시간으로
  recommend: (position: { latitude: number; longitude: number }, minutes?: number) => Promise<CourseRecommendation>;
};

const httpCourseService: CourseService = {
  recommend: ({ latitude, longitude }, minutes) =>
    apiRequest<CourseRecommendation>('/recommendations/courses', { query: { lat: latitude, lng: longitude, minutes } }),
};

// 서버 없이 실행할 때: 내 위치 주변 예시 공원 두 곳
function mockPark(id: number, title: string, from: { latitude: number; longitude: number }, dLat: number, dLng: number, pace: number): Course {
  const latitude = from.latitude + dLat;
  const longitude = from.longitude + dLng;
  const distance = Math.round((distanceMeters(from, { latitude, longitude }) * 2.6) / 10) * 10;
  return {
    id: `park-${id}`, type: 'PARK', title, subtitle: '근린공원 · 예시', latitude, longitude,
    distanceMeters: distance, estimatedMinutes: Math.round(distance / pace), score: 80 - id * 5,
    reasons: ['평소 산책 거리와 비슷해요', '화장실·음수대가 있어요'], parkId: id, walkId: null,
    address: '예시 주소', areaSquareMeters: 30000, convenience: '화장실, 음수대', nearbyFacilities: [], path: [],
  };
}

const mockCourseService: CourseService = {
  recommend: async (position, minutes = 30) => ({
    targetMinutes: minutes,
    targetMeters: minutes * 50,
    paceMetersPerMinute: 50,
    courses: [mockPark(1, '예시 근린공원', position, 0.005, 0.002, 50), mockPark(2, '예시 수변공원', position, -0.003, 0.006, 50)],
  }),
};

export const courseService: CourseService = isMockAuth ? mockCourseService : httpCourseService;
