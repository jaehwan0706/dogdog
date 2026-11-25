// 백엔드 FacilityDtos 와 맞춘 타입 (반려동물 동반 가능 시설, 공공데이터)

export type FacilityCategory =
  | 'HOSPITAL'
  | 'PHARMACY'
  | 'CAFE'
  | 'RESTAURANT'
  | 'PET_SHOP'
  | 'GROOMING'
  | 'PET_CARE'
  | 'STAY'
  | 'TRAVEL'
  | 'CULTURE';

export type FacilitySummary = {
  id: number;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  address: string | null;
};

// truncated: 범위 안에 더 많은 시설이 있어 가까운 것만 담김
export type FacilityMapResult = { facilities: FacilitySummary[]; truncated: boolean };

// 원본에 값이 없으면 null
export type FacilityDetail = FacilitySummary & {
  roadAddress: string | null;
  lotAddress: string | null;
  phone: string | null;
  homepage: string | null;
  closedDays: string | null;
  openingHours: string | null;
  parking: boolean | null;
  indoor: boolean | null;
  outdoor: boolean | null;
  petSize: string | null;
  petRestrictions: string | null;
  petExtraFee: string | null;
  entranceFee: string | null;
  description: string | null;
  // 원본 데이터의 최종작성일 (운영 정보 기준일)
  sourceUpdatedAt: string | null;
};

// 지도 화면 범위 (남서·북동 꼭짓점)
export type MapBounds = { swLat: number; swLng: number; neLat: number; neLng: number };

// 지도 화면의 분류 묶음 칩
export type FacilityGroup = 'medical' | 'food' | 'care' | 'outing';

export const FACILITY_GROUPS: { value: FacilityGroup; label: string; categories: FacilityCategory[] }[] = [
  { value: 'medical', label: '병원·약국', categories: ['HOSPITAL', 'PHARMACY'] },
  { value: 'food', label: '카페·식당', categories: ['CAFE', 'RESTAURANT'] },
  { value: 'care', label: '용품·미용', categories: ['PET_SHOP', 'GROOMING', 'PET_CARE'] },
  { value: 'outing', label: '여행·숙소', categories: ['TRAVEL', 'STAY', 'CULTURE'] },
];
