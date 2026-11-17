import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { walkService } from '../../api/walk/walkService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { RootScreenProps } from '../../navigation/RootNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { Walk } from '../../types/walk';
import { formatDistance, formatDuration } from '../../utils/geo';
import { summarize, toDateKey, walkDateKey } from '../../utils/walkStats';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 산책 기록 목록: 한 달씩 보여주고, 누르면 산책 결과(경로·사진) 화면으로 이동
export function WalkHistoryScreen({ navigation }: RootScreenProps<'WalkHistory'>) {
  const now = new Date();
  // 보고 있는 달의 1일
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const walks = useAsyncData(() => {
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return walkService.getMyWalks({ from: toDateKey(month), to: toDateKey(lastDay) });
  }, [month.getTime()]);
  // 결과 화면에서 기록을 지우고 돌아오면 다시 불러온다
  const { reload } = walks;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const moveMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const list = walks.data ?? [];
  const total = summarize(list);
  const groups = groupByDate(list);

  return (
    <Screen title="산책 기록" onBack={navigation.goBack}>
      <View style={styles.monthBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={10} onPress={() => moveMonth(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthTitle}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={10} disabled={isCurrentMonth} onPress={() => moveMonth(1)}>
          <MaterialCommunityIcons name="chevron-right" size={26} color={isCurrentMonth ? colors.line : colors.ink} />
        </Pressable>
      </View>

      <AppCard>
        <View style={styles.summary}>
          <SummaryItem value={`${total.count}회`} label="산책" />
          <SummaryItem value={formatDistance(total.distanceMeters)} label="총 거리" />
          <SummaryItem value={formatDuration(total.durationSeconds)} label="총 시간" />
        </View>
      </AppCard>

      {walks.data === null ? (
        <View style={styles.center}>
          {walks.error ? (
            <>
              <Text style={styles.empty}>{walks.error}</Text>
              <AppButton label="다시 시도" variant="ghost" onPress={reload} />
            </>
          ) : <ActivityIndicator color={colors.forest} />}
        </View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="paw-outline" size={36} color={colors.inkFaint} />
          <Text style={styles.empty}>이 달에는 산책 기록이 없어요.</Text>
        </View>
      ) : (
        groups.map(([dateKey, items]) => (
          <View key={dateKey} style={styles.group}>
            <Text style={styles.groupTitle}>{formatDateHeader(dateKey)}</Text>
            {items.map((walk) => (
              <Pressable
                key={walk.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('WalkResult', { walkId: walk.id })}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemIcon}><MaterialCommunityIcons name="walk" size={20} color={colors.forest} /></View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{formatDistance(walk.distanceMeters)} · {formatDuration(walk.durationSeconds)}</Text>
                  <Text style={styles.itemBody}>{walk.startedAt.slice(11, 16)} 시작{walk.dogName ? ` · ${walk.dogName}` : ''}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />
              </Pressable>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

// 서버가 최신순으로 주므로 순서를 유지한 채 날짜별로 묶는다
function groupByDate(walks: Walk[]) {
  const groups = new Map<string, Walk[]>();
  for (const walk of walks) {
    const key = walkDateKey(walk);
    groups.set(key, [...(groups.get(key) ?? []), walk]);
  }
  return [...groups.entries()];
}

// "2026-11-17" → "11월 17일 (화)"
function formatDateHeader(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_LABELS[date.getDay()]})`;
}

function SummaryItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthTitle: { ...typography.heading, color: colors.ink },
  summary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { ...typography.heading, color: colors.ink },
  summaryLabel: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.xs },
  center: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.section },
  empty: { ...typography.body, color: colors.inkSoft },
  group: { gap: spacing.sm },
  groupTitle: { ...typography.label, color: colors.inkSoft },
  item: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  itemPressed: { backgroundColor: colors.ivory },
  itemIcon: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 },
  itemCopy: { flex: 1 },
  itemTitle: { ...typography.label, color: colors.ink },
  itemBody: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
});
