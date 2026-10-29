// 백엔드 DogDtos 와 맞춘 타입

export type DogGender = 'MALE' | 'FEMALE';

export type Dog = {
  id: number;
  ownerId: number;
  name: string;
  breed: string | null;
  gender: DogGender | null;
  birthDate: string | null; // YYYY-MM-DD
  weightKg: number | null;
  neutered: boolean | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

// 생성·수정 공통 입력값 (수정은 PATCH 라 null/undefined 필드는 바뀌지 않음)
export type DogInput = {
  name: string;
  breed?: string;
  gender?: DogGender;
  birthDate?: string;
  weightKg?: number;
  neutered?: boolean;
};
