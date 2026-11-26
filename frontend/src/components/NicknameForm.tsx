import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { userService } from '../api/user/userService';
import { colors, radius, spacing, typography } from '../theme';
import { AppButton } from './AppButton';

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;

// 닉네임 입력 → 길이 확인 → 중복 확인 → 저장. 가입 직후 화면과 마이페이지 변경 화면이 같이 쓴다
export function NicknameForm({ initialNickname, submitLabel, onSaved }: {
  initialNickname: string;
  submitLabel: string;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = nickname.trim();
  const lengthOk = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
  const unchanged = trimmed === initialNickname.trim();

  const save = async () => {
    if (!lengthOk) {
      setError(`닉네임은 ${MIN_LENGTH}~${MAX_LENGTH}자로 정해 주세요.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 그대로 쓰는 경우는 확인·저장 없이 넘어간다
      if (!unchanged) {
        if (!(await userService.isNicknameAvailable(trimmed))) {
          setError('이미 쓰고 있는 닉네임이에요. 다른 닉네임을 입력해 주세요.');
          return;
        }
        await userService.updateNickname(trimmed);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '닉네임을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        accessibilityLabel="닉네임"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={MAX_LENGTH}
        onChangeText={(value) => {
          setNickname(value);
          setError(null);
        }}
        onSubmitEditing={save}
        placeholder={`닉네임 (${MIN_LENGTH}~${MAX_LENGTH}자)`}
        placeholderTextColor={colors.inkFaint}
        returnKeyType="done"
        style={styles.input}
        value={nickname}
      />
      <Text style={styles.count}>{trimmed.length}/{MAX_LENGTH}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={!lengthOk || saving} label={saving ? '저장 중…' : submitLabel} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 52, paddingHorizontal: spacing.lg, ...typography.body },
  count: { alignSelf: 'flex-end', color: colors.inkFaint, ...typography.caption },
  error: { color: colors.danger, ...typography.label },
});
