import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../api/admin/adminService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { FilterChips } from '../../components/FilterChips';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import { reportReasonLabel, reportStatusLabel, reportTargetLabel, type AdminReport, type ReportAction, type ReportStatus } from '../../types/moderation';
import { confirmAction, notify } from '../../utils/dialog';
import { timeAgo } from '../../utils/format';

const filters: { value: ReportStatus | undefined; label: string }[] = [
  { value: 'PENDING', label: '검토 대기' },
  { value: 'ACTION_TAKEN', label: '조치 완료' },
  { value: 'DISMISSED', label: '문제 없음' },
  { value: undefined, label: '전체' },
];

const actionText: Record<ReportAction, { label: string; confirm: string }> = {
  HIDE: { label: '숨김', confirm: '이 콘텐츠를 숨길까요? 작성자 외에는 보이지 않게 돼요.' },
  SUSPEND: { label: '작성자 정지', confirm: '작성자를 이용정지할까요? 로그인과 글쓰기가 막혀요.' },
  DISMISS: { label: '문제 없음', confirm: '문제 없음으로 신고를 종료할까요?' },
};

export function AdminReportsScreen({ navigation }: ProfileScreenProps<'AdminReports'>) {
  const [status, setStatus] = useState<ReportStatus | undefined>('PENDING');
  const reports = useAsyncData(() => adminService.getReports(status), [status]);
  const items = reports.data?.content ?? [];

  const resolve = (report: AdminReport, action: ReportAction) =>
    confirmAction({
      title: actionText[action].confirm,
      message: report.targetReportCount > 1 ? `같은 대상의 신고 ${report.targetReportCount}건이 함께 처리돼요.` : undefined,
      confirmText: actionText[action].label,
      destructive: action !== 'DISMISS',
      onConfirm: async () => {
        try {
          await adminService.resolveReport(report.id, action);
          await reports.reload();
        } catch (e) {
          notify('처리하지 못했어요', e instanceof Error ? e.message : undefined);
        }
      },
    });

  return (
    <Screen title="신고 처리" onBack={navigation.goBack}>
      <FilterChips options={filters} value={status} onChange={setStatus} />
      {items.length > 0 && !reports.error
        ? items.map((report) => (
            <AppCard key={report.id}>
              <View style={styles.head}>
                <Text style={styles.type}>{reportTargetLabel[report.targetType]}</Text>
                <Text style={styles.reason}>{reportReasonLabel[report.reason]}</Text>
                {report.targetReportCount > 1 ? <Text style={styles.count}>신고 {report.targetReportCount}건</Text> : null}
                <Text style={styles.status}>{reportStatusLabel[report.status]}</Text>
              </View>
              {report.target.exists ? (
                <>
                  <Text style={styles.preview} numberOfLines={3}>{report.target.preview}</Text>
                  <Text style={styles.meta}>
                    작성자 {report.target.authorNickname}
                    {report.target.authorStatus === 'SUSPENDED' ? ' · 이용정지됨' : ''}
                    {report.target.hidden ? ' · 숨김 처리됨' : ''}
                  </Text>
                </>
              ) : (
                <Text style={styles.meta}>삭제된 대상이에요.</Text>
              )}
              {report.detail ? <Text style={styles.detail}>“{report.detail}”</Text> : null}
              <Text style={styles.meta}>신고자 {report.reporterNickname ?? '알 수 없음'} · {timeAgo(report.createdAt)}</Text>
              {report.status === 'PENDING' ? (
                <View style={styles.actions}>
                  {report.targetType !== 'USER' && report.target.exists ? <View style={styles.flex}><AppButton label="숨김" variant="secondary" onPress={() => resolve(report, 'HIDE')} /></View> : null}
                  {report.target.exists && report.target.authorStatus === 'ACTIVE' ? <View style={styles.flex}><AppButton label="작성자 정지" variant="ghost" onPress={() => resolve(report, 'SUSPEND')} /></View> : null}
                  <View style={styles.flex}><AppButton label="문제 없음" variant="ghost" onPress={() => resolve(report, 'DISMISS')} /></View>
                </View>
              ) : report.adminMemo ? <Text style={styles.meta}>메모: {report.adminMemo}</Text> : null}
            </AppCard>
          ))
        : <LoadState loading={reports.loading} error={reports.error} empty emptyText="처리할 신고가 없어요." onRetry={reports.reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  type: { backgroundColor: colors.forestSoft, borderRadius: radius.pill, color: colors.forest, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: 2, ...typography.caption, fontWeight: '700' },
  reason: { color: colors.ink, ...typography.label },
  count: { color: colors.coral, ...typography.label },
  status: { color: colors.inkFaint, marginLeft: 'auto', ...typography.caption },
  preview: { color: colors.ink, marginTop: spacing.sm, ...typography.body },
  detail: { color: colors.inkSoft, marginTop: spacing.xs, ...typography.caption },
  meta: { color: colors.inkFaint, marginTop: spacing.xs, ...typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
