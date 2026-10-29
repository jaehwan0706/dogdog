import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { communityService } from '../../api/community/communityService';
import { AppButton } from '../../components/AppButton';
import { categoryLabel } from '../../components/community/PostCard';
import { Screen } from '../../components/Screen';
import type { CommunityScreenProps } from '../../navigation/CommunityNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { PostCategory } from '../../types/community';

const categories: PostCategory[] = ['FREE', 'WALK_MATE', 'CARE_SHARE'];

export function PostWriteScreen({ navigation }: CommunityScreenProps<'PostWrite'>) {
  const [category, setCategory] = useState<PostCategory>('FREE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [meetAt, setMeetAt] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 산책메이트·케어 품앗이는 모집 글이라 약속 시간과 모집 인원이 필요 (서버 규칙과 동일)
  const isRecruit = category !== 'FREE';
  const canSubmit = title.trim() !== '' && content.trim() !== '' && (!isRecruit || (meetAt !== '' && maxParticipants !== ''));

  const submit = async () => {
    if (isRecruit && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(meetAt)) {
      setError('약속 시간은 2026-11-01 18:00 형식으로 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const post = await communityService.createPost({
        category,
        title: title.trim(),
        content: content.trim(),
        ...(isRecruit && { meetAt: `${meetAt.replace(' ', 'T')}:00`, placeName: placeName.trim() || undefined, maxParticipants: Number(maxParticipants) }),
      });
      navigation.replace('PostDetail', { postId: post.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록하지 못했어요.');
      setSaving(false);
    }
  };

  return (
    <Screen title="글쓰기" onBack={navigation.goBack}>
      <View style={styles.categories}>
        {categories.map((value) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: category === value }} onPress={() => setCategory(value)} style={[styles.category, category === value && styles.categoryActive]}>
            <Text style={[styles.categoryText, category === value && styles.categoryTextActive]}>{categoryLabel[value]}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput maxLength={100} onChangeText={setTitle} placeholder="제목" placeholderTextColor={colors.inkFaint} style={styles.input} value={title} />
      <TextInput maxLength={5000} multiline onChangeText={setContent} placeholder={isRecruit ? '어디서, 어떻게 함께할지 알려주세요.' : '산책 이야기를 나눠보세요.'} placeholderTextColor={colors.inkFaint} style={[styles.input, styles.content]} textAlignVertical="top" value={content} />
      {isRecruit ? (
        <>
          <TextInput maxLength={16} onChangeText={setMeetAt} placeholder="약속 시간 (예: 2026-11-01 18:00)" placeholderTextColor={colors.inkFaint} style={styles.input} value={meetAt} />
          <TextInput maxLength={100} onChangeText={setPlaceName} placeholder="장소 (선택, 예: 서울숲 정문)" placeholderTextColor={colors.inkFaint} style={styles.input} value={placeName} />
          <TextInput keyboardType="number-pad" maxLength={2} onChangeText={setMaxParticipants} placeholder="모집 인원 (1~50)" placeholderTextColor={colors.inkFaint} style={styles.input} value={maxParticipants} />
        </>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={!canSubmit || saving} label={saving ? '등록 중…' : '등록하기'} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: 'row', gap: spacing.sm },
  category: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, flex: 1, paddingVertical: spacing.sm },
  categoryActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryText: { color: colors.inkSoft, ...typography.label },
  categoryTextActive: { color: colors.white },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 50, paddingHorizontal: spacing.lg, ...typography.body },
  content: { minHeight: 180, paddingTop: spacing.md },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
