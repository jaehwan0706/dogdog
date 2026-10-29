import { Screen } from '../../components/Screen';
import { DogForm } from './DogForm';

// 로그인 후 등록된 반려견이 없으면 메인 화면 대신 보여준다. 저장하면 dogStore 가 채워져 App 이 메인으로 전환
export function DogOnboardingScreen() {
  return (
    <Screen title="반려견을 소개해주세요" subtitle="산책 기록과 추천을 우리 아이에게 맞춰드릴게요.">
      <DogForm submitLabel="등록하고 시작하기" onSaved={() => {}} />
    </Screen>
  );
}
