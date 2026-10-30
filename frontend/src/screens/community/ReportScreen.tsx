import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { moderationService } from '../../api/moderation/moderationService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import type { CommunityScreenProps } from '../../navigation/CommunityNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import { reportReasonLabel, reportTargetLabel, type ReportReason } from '../../types/moderation';
import { notify } from '../../utils/dialog';

const reasons = Object.keys(reportReasonLabel) as ReportReason[];

// 게시글·댓글 신고. 접수되면 관리자가 검토해 숨김·이용정지 등을 결정한다.
export function ReportScreen({ navigation, route }: CommunityScreenProps<'Report'>) {
  const { targetType, targetId, targetLabel } = route.params;
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      await moderationService.report({ targetType, targetId, reason, detail: detail.trim() || undefined });
      notify('신고가 접수됐어요', '운영진이 확인 후 조치할게요.');
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고하지 못했어요.');
      setSending(false);
    }
  };

  return (
    <Screen title={`${reportTargetLabel[targetType]} 신고`} onBack={navigation.goBack}>
      <AppCard>
        <Text style={styles.label}>신고 대상</Text>
        <Text style={styles.target} numberOfLines={2}>{targetLabel}</Text>
      </AppCard>
      <Text style={styles.sectionTitle}>신고 사유를 선택해 주세요</Text>
      <View style={styles.reasons}>
        {reasons.map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: reason === value }} onPress={() => setReason(value)} style={[styles.reason, reason === value && styles.reasonActive]}>
            <Text style={[styles.reasonText, reason === value && styles.reasonTextActive]}>{reportReasonLabel[value]}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput maxLength={500} multiline onChangeText={setDetail} placeholder="자세한 내용 (선택)" placeholderTextColor={colors.inkFaint} style={styles.detail} textAlignVertical="top" value={detail} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={!reason || sending} label={sending ? '접수 중…' : '신고하기'} onPress={submit} />
      <Text style={styles.notice}>허위 신고가 반복되면 서비스 이용이 제한될 수 있어요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.inkFaint, ...typography.caption },
  target: { color: colors.ink, marginTop: spacing.xs, ...typography.body },
  sectionTitle: { color: colors.ink, ...typography.heading },
  reasons: { gap: spacing.sm },
  reason: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
  reasonActive: { backgroundColor: colors.forestSoft, borderColor: colors.forest },
  reasonText: { color: colors.ink, ...typography.body },
  reasonTextActive: { color: colors.forest, fontWeight: '700' },
  detail: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 110, padding: spacing.md, ...typography.body },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  notice: { color: colors.inkFaint, textAlign: 'center', ...typography.caption },
});
