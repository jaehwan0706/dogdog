import { useSyncExternalStore } from 'react';
import { dogService } from '../api/dog/dogService';
import type { Dog } from '../types/dog';

// 내 반려견 목록. 홈·마이페이지·온보딩이 같은 목록을 보도록 한 곳에 둔다.
// dogs 가 null 이면 아직 불러오지 않은 상태, [] 이면 등록된 반려견이 없는 상태(온보딩 대상)
type DogState = { dogs: Dog[] | null; error: string | null };

let state: DogState = { dogs: null, error: null };
const listeners = new Set<() => void>();

function setState(next: DogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const dogStore = {
  getState: () => state,
  async load() {
    setState({ ...state, error: null });
    try {
      setState({ dogs: await dogService.getMyDogs(), error: null });
    } catch (e) {
      setState({ ...state, error: e instanceof Error ? e.message : '반려견 정보를 불러오지 못했어요.' });
    }
  },
  // 생성·수정 후 목록에 바로 반영
  upsert(dog: Dog) {
    const dogs = state.dogs ?? [];
    setState({ ...state, dogs: dogs.some((item) => item.id === dog.id) ? dogs.map((item) => (item.id === dog.id ? dog : item)) : [...dogs, dog] });
  },
  remove(dogId: number) {
    setState({ ...state, dogs: (state.dogs ?? []).filter((item) => item.id !== dogId) });
  },
  reset() {
    setState({ dogs: null, error: null });
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useDogs() {
  return useSyncExternalStore(dogStore.subscribe, dogStore.getState, dogStore.getState);
}

// 첫 번째로 등록한 반려견을 대표 반려견으로 쓴다
export function useMainDog() {
  return useDogs().dogs?.[0] ?? null;
}
