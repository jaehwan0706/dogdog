// 백엔드 PhotoPinDtos 와 맞춘 타입

export type PhotoPin = {
  id: number;
  walkId: number | null;
  latitude: number;
  longitude: number;
  // 일정 시간(1시간)만 유효한 서명된 주소. 만료되면 목록을 다시 불러와 새 주소를 받는다
  imageUrl: string;
  memo: string | null;
  createdAt: string;
};

// 카메라/앨범에서 고른 사진 (expo-image-picker 결과에서 필요한 값만)
export type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type PhotoPinInput = {
  photo: PickedPhoto;
  latitude: number;
  longitude: number;
  memo?: string;
  walkId?: number;
};
