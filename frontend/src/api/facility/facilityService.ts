import { ApiError, apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { FacilityCategory, FacilityDetail, FacilityMapResult, FacilitySummary, MapBounds } from '../../types/facility';
import { distanceMeters } from '../../utils/geo';

// 한 번에 지도에 그릴 최대 시설 수 (서버 최대 300)
export const FACILITY_MAP_LIMIT = 200;
// 서버가 받는 지도 범위 한 변의 최대 크기(도). 이보다 넓으면 조회하지 않고 "확대해 주세요" 안내
export const FACILITY_MAX_SPAN = 0.5;

export type FacilityService = {
  getInBounds: (bounds: MapBounds, categories?: FacilityCategory[]) => Promise<FacilityMapResult>;
  // center: 보통 지도 가운데. 가까운 순으로 최대 30개
  search: (keyword: string, center: { latitude: number; longitude: number }, categories?: FacilityCategory[]) => Promise<FacilitySummary[]>;
  getDetail: (id: number) => Promise<FacilityDetail>;
};

const joinCategories = (categories?: FacilityCategory[]) => (categories?.length ? categories.join(',') : undefined);

const httpFacilityService: FacilityService = {
  getInBounds: (bounds, categories) =>
    apiRequest<FacilityMapResult>('/facilities', {
      query: { ...bounds, categories: joinCategories(categories), limit: FACILITY_MAP_LIMIT },
    }),
  search: (keyword, center, categories) =>
    apiRequest<FacilitySummary[]>('/facilities/search', {
      query: { q: keyword, lat: center.latitude, lng: center.longitude, categories: joinCategories(categories) },
    }),
  getDetail: (id) => apiRequest<FacilityDetail>(`/facilities/${id}`),
};

// 서버 없이 실행할 때: 서울시청 주변 예시 시설
function mockFacility(id: number, name: string, category: FacilityCategory, categoryLabel: string, latitude: number, longitude: number): FacilityDetail {
  return {
    id, name, category, categoryLabel, latitude, longitude,
    address: '서울특별시 중구 예시로 1', roadAddress: '서울특별시 중구 예시로 1', lotAddress: null,
    phone: '02-000-0000', homepage: null, closedDays: '연중무휴', openingHours: '매일 10:00~20:00',
    parking: true, indoor: true, outdoor: false, petSize: '모두 가능', petRestrictions: '목줄, 배변봉투',
    petExtraFee: '없음', entranceFee: '변동', description: '예시 시설', sourceUpdatedAt: '2025-03-24',
  };
}

const mockFacilities: FacilityDetail[] = [
  mockFacility(1, '예시 동물병원', 'HOSPITAL', '동물병원', 37.5672, 126.9790),
  mockFacility(2, '예시 애견카페', 'CAFE', '카페', 37.5659, 126.9772),
  mockFacility(3, '예시 동반식당', 'RESTAURANT', '식당', 37.5661, 126.9801),
  mockFacility(4, '예시 반려용품점', 'PET_SHOP', '반려동물용품', 37.5679, 126.9768),
  mockFacility(5, '예시 공원', 'TRAVEL', '여행지', 37.5650, 126.9795),
];

const toSummary = ({ id, name, category, categoryLabel, latitude, longitude, address }: FacilityDetail): FacilitySummary =>
  ({ id, name, category, categoryLabel, latitude, longitude, address });

const inCategories = (facility: FacilityDetail, categories?: FacilityCategory[]) =>
  !categories?.length || categories.includes(facility.category);

const mockFacilityService: FacilityService = {
  getInBounds: async (bounds, categories) => ({
    facilities: mockFacilities
      .filter((f) => inCategories(f, categories)
        && f.latitude >= bounds.swLat && f.latitude <= bounds.neLat
        && f.longitude >= bounds.swLng && f.longitude <= bounds.neLng)
      .map(toSummary),
    truncated: false,
  }),
  search: async (keyword, center, categories) =>
    mockFacilities
      .filter((f) => inCategories(f, categories) && f.name.toLowerCase().includes(keyword.trim().toLowerCase()))
      .sort((a, b) => distanceMeters(center, a) - distanceMeters(center, b))
      .map(toSummary),
  getDetail: async (id) => {
    const found = mockFacilities.find((f) => f.id === id);
    if (!found) throw new ApiError(404, 'FACILITY_NOT_FOUND', '시설 정보를 찾을 수 없습니다.');
    return found;
  },
};

export const facilityService: FacilityService = isMockAuth ? mockFacilityService : httpFacilityService;
