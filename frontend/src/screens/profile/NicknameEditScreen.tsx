import { NicknameForm } from '../../components/NicknameForm';
import { Screen } from '../../components/Screen';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { useAuthSession } from '../../store/authStore';

// 마이페이지 → 닉네임 변경
export function NicknameEditScreen({ navigation }: ProfileScreenProps<'NicknameEdit'>) {
  const session = useAuthSession();

  return (
    <Screen title="닉네임 변경" subtitle="커뮤니티에서 보이는 이름이에요." onBack={navigation.goBack}>
      <NicknameForm initialNickname={session?.user.nickname ?? ''} submitLabel="저장하기" onSaved={navigation.goBack} />
    </Screen>
  );
}
