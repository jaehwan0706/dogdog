import { Platform } from 'react-native';
import { API_BASE_URL, apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { PhotoPin, PhotoPinInput } from '../../types/photoPin';

export type PhotoPinService = {
  getMyPins: () => Promise<PhotoPin[]>;
  createPin: (input: PhotoPinInput) => Promise<PhotoPin>;
  deletePin: (pinId: number) => Promise<void>;
};

// 서버는 "/files/..." 처럼 상대 경로를 줄 수 있어 API 주소를 앞에 붙인다 (S3 등은 전체 주소라 그대로)
function withAbsoluteImageUrl(pin: PhotoPin): PhotoPin {
  return pin.imageUrl.startsWith('/') ? { ...pin, imageUrl: `${API_BASE_URL}${pin.imageUrl}` } : pin;
}

async function toFormData({ photo, latitude, longitude, memo, walkId }: PhotoPinInput) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // 웹은 uri 가 blob:/data: 주소라 실제 파일(Blob)로 바꿔서 넣어야 한다
    const blob = await (await fetch(photo.uri)).blob();
    form.append('image', blob, photo.fileName);
  } else {
    // iOS/Android 는 { uri, name, type } 을 넣으면 RN 이 파일을 읽어 전송한다
    form.append('image', { uri: photo.uri, name: photo.fileName, type: photo.mimeType } as unknown as Blob);
  }
  form.append('latitude', String(latitude));
  form.append('longitude', String(longitude));
  if (memo) form.append('memo', memo);
  if (walkId !== undefined) form.append('walkId', String(walkId));
  return form;
}

const httpPhotoPinService: PhotoPinService = {
  getMyPins: async () => (await apiRequest<PhotoPin[]>('/photo-pins')).map(withAbsoluteImageUrl),
  createPin: async (input) =>
    withAbsoluteImageUrl(await apiRequest<PhotoPin>('/photo-pins', { method: 'POST', body: await toFormData(input) })),
  deletePin: (pinId) => apiRequest<void>(`/photo-pins/${pinId}`, { method: 'DELETE' }),
};

// 서버 없이 실행할 때: 앱을 켜 있는 동안만 메모리에 저장 (사진은 기기 안의 파일 주소 그대로)
let mockPins: PhotoPin[] = [];
let mockId = 1;

const mockPhotoPinService: PhotoPinService = {
  getMyPins: async () => [...mockPins],
  async createPin({ photo, latitude, longitude, memo, walkId }) {
    const pin: PhotoPin = {
      id: mockId++,
      walkId: walkId ?? null,
      latitude,
      longitude,
      imageUrl: photo.uri,
      memo: memo?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    mockPins = [pin, ...mockPins];
    return pin;
  },
  async deletePin(pinId) {
    mockPins = mockPins.filter((pin) => pin.id !== pinId);
  },
};

export const photoPinService: PhotoPinService = isMockAuth ? mockPhotoPinService : httpPhotoPinService;
