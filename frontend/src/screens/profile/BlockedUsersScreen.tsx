import { StyleSheet, Text, View } from 'react-native';
import { moderationService } from '../../api/moderation/moderationService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { colors, spacing, typography } from '../../theme';
import { notify } from '../../utils/dialog';
import { timeAgo } from '../../utils/format';

export function BlockedUsersScreen({ navigation }: ProfileScreenProps<'BlockedUsers'>) {
  const blocked = useAsyncData(() => moderationService.getBlockedUsers(), []);
  const items = blocked.data ?? [];

  const unblock = async (userId: number) => {
    try {
      await moderationService.unblock(userId);
      blocked.setData(items.filter((item) => item.userId !== userId));
    } catch (e) {
      notify('차단을 해제하지 못했어요', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <Screen title="차단한 사용자" subtitle="차단한 사용자의 글과 댓글은 보이지 않아요." onBack={navigation.goBack}>
      {items.length > 0 && !blocked.error
        ? items.map((user) => (
            <AppCard key={user.userId}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.name}>{user.nickname}</Text>
                  <Text style={styles.meta}>{timeAgo(user.blockedAt)} 차단</Text>
                </View>
                <AppButton label="차단 해제" variant="ghost" onPress={() => unblock(user.userId)} />
              </View>
            </AppCard>
          ))
        : <LoadState loading={blocked.loading} error={blocked.error} empty emptyText="차단한 사용자가 없어요." onRetry={blocked.reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  name: { color: colors.ink, ...typography.heading },
  meta: { color: colors.inkFaint, marginTop: 2, ...typography.caption },
});
