import { recommendationService } from '../api/recommendation/recommendationService';
import { useMainDog } from '../store/dogStore';
import { useApproxLocation } from './useApproxLocation';
import { useAsyncData } from './useAsyncData';

// 내 위치 기준 추천 산책 시간. 위치 권한이 없으면 data 는 null 이고 location.status 가 'denied'
export function useWalkTimeRecommendation() {
  const location = useApproxLocation();
  const dogId = useMainDog()?.id;
  const position = location.location;

  const recommendation = useAsyncData(
    () => (position ? recommendationService.getWalkTimes(position, dogId) : Promise.resolve(null)),
    [position?.latitude, position?.longitude, dogId],
  );

  return { location, recommendation };
}
