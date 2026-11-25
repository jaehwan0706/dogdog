import { apiRequest } from '../client';
import { isMockAuth } from '../auth/authService';
import type { Dog, DogInput } from '../../types/dog';

export type DogService = {
  getMyDogs: () => Promise<Dog[]>;
  createDog: (input: DogInput) => Promise<Dog>;
  updateDog: (dogId: number, input: Partial<DogInput>) => Promise<Dog>;
  deleteDog: (dogId: number) => Promise<void>;
};

const httpDogService: DogService = {
  getMyDogs: () => apiRequest<Dog[]>('/dogs'),
  createDog: (input) => apiRequest<Dog>('/dogs', { method: 'POST', body: input }),
  updateDog: (dogId, input) => apiRequest<Dog>(`/dogs/${dogId}`, { method: 'PATCH', body: input }),
  deleteDog: (dogId) => apiRequest<void>(`/dogs/${dogId}`, { method: 'DELETE' }),
};

// 서버 없이 실행할 때: 앱을 켜 있는 동안만 메모리에 저장
let mockDogs: Dog[] = [];
let mockId = 1;

const mockDogService: DogService = {
  getMyDogs: async () => [...mockDogs],
  async createDog(input) {
    const now = new Date().toISOString();
    const dog: Dog = { id: mockId++, ownerId: 1, breed: null, gender: null, birthDate: null, weightKg: null, neutered: null, profileImageUrl: null, ...input, createdAt: now, updatedAt: now };
    mockDogs.push(dog);
    return dog;
  },
  async updateDog(dogId, input) {
    const dog = mockDogs.find((item) => item.id === dogId);
    if (!dog) throw new Error('반려견을 찾을 수 없어요.');
    Object.assign(dog, input, { updatedAt: new Date().toISOString() });
    return { ...dog };
  },
  async deleteDog(dogId) {
    mockDogs = mockDogs.filter((item) => item.id !== dogId);
  },
};

export const dogService: DogService = isMockAuth ? mockDogService : httpDogService;
