import { StyleSheet, Text } from 'react-native';
import { NicknameForm } from '../../components/NicknameForm';
import { Screen } from '../../components/Screen';
import { authStore, useAuthSession } from '../../store/authStore';
import { colors, typography } from '../../theme';

// 카카오·구글로 처음 가입한 직후, 반려견 등록 전에 닉네임을 정한다.
// 소셜 이름이 미리 채워져 있어 그대로 써도 된다. 닉네임은 커뮤니티 글·댓글에 보인다
export function NicknameSetupScreen() {
  const session = useAuthSession();
  const current = session?.user.nickname ?? '';

  return (
    <Screen title="닉네임을 정해 주세요" subtitle="커뮤니티에서 다른 보호자에게 보이는 이름이에요.">
      <NicknameForm initialNickname={current} submitLabel="이 닉네임으로 시작하기" onSaved={() => authStore.finishNicknameSetup()} />
      <Text style={styles.hint}>닉네임은 나중에 마이페이지에서도 바꿀 수 있어요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.inkSoft, textAlign: 'center', ...typography.caption },
});
