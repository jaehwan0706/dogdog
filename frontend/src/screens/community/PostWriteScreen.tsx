import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { communityService } from '../../api/community/communityService';
import { AppButton } from '../../components/AppButton';
import { categoryLabel } from '../../components/community/PostCard';
import { Screen } from '../../components/Screen';
import { CARE_SHARE_LIABILITY_TEXT } from '../../constants/legal';
import { LoadState } from '../../components/shop/ShopParts';
import type { CommunityScreenProps } from '../../navigation/CommunityNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { PostCategory } from '../../types/community';
import { formatDateTimeInput, isValidDate } from '../../utils/format';

const categories: PostCategory[] = ['FREE', 'WALK_MATE', 'CARE_SHARE'];

// 글쓰기와 수정(route.params.postId)을 함께 처리한다. 수정할 때 카테고리는 바꿀 수 없다.
export function PostWriteScreen({ navigation, route }: CommunityScreenProps<'PostWrite'>) {
  const postId = route.params?.postId;
  const isEdit = postId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const [originalMeetAt, setOriginalMeetAt] = useState('');
  const [category, setCategory] = useState<PostCategory>('FREE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [meetAt, setMeetAt] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  // 케어 품앗이 새 글은 면책 안내에 동의해야 등록할 수 있다
  const [liabilityAgreed, setLiabilityAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId === undefined) return;
    communityService.getPost(postId)
      .then((post) => {
        const meet = post.recruit ? post.recruit.meetAt.slice(0, 16).replace('T', ' ') : '';
        setCategory(post.category);
        setTitle(post.title);
        setContent(post.content);
        setMeetAt(meet);
        setOriginalMeetAt(meet);
        setPlaceName(post.recruit?.placeName ?? '');
        setMaxParticipants(post.recruit ? String(post.recruit.maxParticipants) : '');
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [postId]);

  // 산책메이트·케어 품앗이는 모집 글이라 약속 시간과 모집 인원이 필요 (서버 규칙과 동일)
  const isRecruit = category !== 'FREE';
  const needsLiability = !isEdit && category === 'CARE_SHARE';
  const canSubmit = title.trim() !== '' && content.trim() !== '' && (!isRecruit || (meetAt !== '' && maxParticipants !== '')) && (!needsLiability || liabilityAgreed);

  const submit = async () => {
    if (isRecruit && (!/^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d$/.test(meetAt) || !isValidDate(meetAt.slice(0, 10)))) {
      setError('약속 시간을 다시 확인해 주세요. 숫자 12자리로 입력하면 돼요. (예: 202611011800)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const meetAtValue = `${meetAt.replace(' ', 'T')}:00`;
      if (postId !== undefined) {
        await communityService.updatePost(postId, {
          title: title.trim(),
          content: content.trim(),
          // 약속 시간은 바꿨을 때만 보낸다 (서버가 지난 시간을 거부해서, 이미 지난 모집 글도 내용은 고칠 수 있게)
          ...(isRecruit && { ...(meetAt !== originalMeetAt && { meetAt: meetAtValue }), placeName: placeName.trim(), maxParticipants: Number(maxParticipants) }),
        });
        navigation.goBack();
        return;
      }
      const post = await communityService.createPost({
        category,
        title: title.trim(),
        content: content.trim(),
        ...(isRecruit && { meetAt: meetAtValue, placeName: placeName.trim() || undefined, maxParticipants: Number(maxParticipants) }),
        ...(category === 'CARE_SHARE' && { liabilityAgreed }),
      });
      navigation.replace('PostDetail', { postId: post.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.');
      setSaving(false);
    }
  };

  return (
    <Screen title={isEdit ? '글 수정' : '글쓰기'} onBack={navigation.goBack}>
      {loading ? <LoadState loading error={null} onRetry={() => {}} /> : (
      <>
      <View style={styles.categories}>
        {(isEdit ? [category] : categories).map((value) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: category === value }} disabled={isEdit} onPress={() => setCategory(value)} style={[styles.category, category === value && styles.categoryActive]}>
            <Text style={[styles.categoryText, category === value && styles.categoryTextActive]}>{categoryLabel[value]}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput maxLength={100} onChangeText={setTitle} placeholder="제목" placeholderTextColor={colors.inkFaint} style={styles.input} value={title} />
      <TextInput maxLength={5000} multiline onChangeText={setContent} placeholder={isRecruit ? '어디서, 어떻게 함께할지 알려주세요.' : '산책 이야기를 나눠보세요.'} placeholderTextColor={colors.inkFaint} style={[styles.input, styles.content]} textAlignVertical="top" value={content} />
      {isRecruit ? (
        <>
          <TextInput keyboardType="number-pad" maxLength={16} onChangeText={(text) => setMeetAt(formatDateTimeInput(text))} placeholder="약속 시간 (숫자만 입력, 예: 202611011800)" placeholderTextColor={colors.inkFaint} style={styles.input} value={meetAt} />
          <TextInput maxLength={100} onChangeText={setPlaceName} placeholder="장소 (선택, 예: 서울숲 정문)" placeholderTextColor={colors.inkFaint} style={styles.input} value={placeName} />
          <TextInput keyboardType="number-pad" maxLength={2} onChangeText={setMaxParticipants} placeholder="모집 인원 (1~50)" placeholderTextColor={colors.inkFaint} style={styles.input} value={maxParticipants} />
        </>
      ) : null}
      {needsLiability ? (
        <View style={styles.liabilityBox}>
          <Text style={styles.liabilityText}>{CARE_SHARE_LIABILITY_TEXT}</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: liabilityAgreed }} onPress={() => setLiabilityAgreed((v) => !v)} style={styles.liabilityCheck}>
            <MaterialCommunityIcons name={liabilityAgreed ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={liabilityAgreed ? colors.forest : colors.inkFaint} />
            <Text style={styles.liabilityCheckText}>[필수] 위 면책 안내를 확인했고 동의해요</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={!canSubmit || saving} label={saving ? '저장 중…' : isEdit ? '수정하기' : '등록하기'} onPress={submit} />
      </>
      )}
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
  liabilityBox: { backgroundColor: colors.ivorySoft, borderRadius: radius.md, gap: spacing.sm, padding: spacing.md },
  liabilityText: { color: colors.inkSoft, fontSize: 12, lineHeight: 18 },
  liabilityCheck: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  liabilityCheckText: { color: colors.ink, flex: 1, ...typography.label },
});
