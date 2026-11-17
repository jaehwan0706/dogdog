import { StyleSheet, Text, Pressable } from 'react-native';
import { dogService } from '../../api/dog/dogService';
import { Screen } from '../../components/Screen';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';
import { dogStore, useDogs } from '../../store/dogStore';
import { colors, spacing, typography } from '../../theme';
import { confirmAction, notify } from '../../utils/dialog';
import { DogForm } from '../dog/DogForm';

export function DogEditScreen({ navigation, route }: ProfileScreenProps<'DogEdit'>) {
  const { dogs } = useDogs();
  const dog = dogs?.find((item) => item.id === route.params.dogId);
  // 마지막 한 마리를 지우면 온보딩으로 돌아가므로 삭제는 2마리 이상일 때만 허용
  const canDelete = dog && (dogs?.length ?? 0) > 1;

  const remove = () =>
    confirmAction({
      title: `${dog!.name} 프로필을 삭제할까요?`,
      confirmText: '삭제',
      destructive: true,
      onConfirm: async () => {
        try {
          await dogService.deleteDog(dog!.id);
          dogStore.remove(dog!.id);
          navigation.goBack();
        } catch (e) {
          notify('삭제하지 못했어요', e instanceof Error ? e.message : undefined);
        }
      },
    });

  return (
    <Screen title={dog ? `${dog.name} 프로필 수정` : '반려견 추가'} onBack={navigation.goBack}>
      {/* key: 다른 반려견으로 바뀌면 폼 입력값을 새로 채움 */}
      <DogForm key={dog?.id ?? 'new'} dog={dog} submitLabel="저장하기" onSaved={() => navigation.goBack()} />
      {canDelete ? (
        <Pressable accessibilityRole="button" onPress={remove} style={styles.delete}>
          <Text style={styles.deleteText}>이 반려견 삭제</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  delete: { alignItems: 'center', paddingVertical: spacing.md },
  deleteText: { color: colors.danger, ...typography.label },
});
