import { Text, StyleSheet } from 'react-native';
import { AppCard } from '../components/AppCard';
import { Screen } from '../components/Screen';
import { colors, typography } from '../theme';

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <Screen title={title} subtitle={description}>
      <AppCard>
        <Text style={styles.text}>이 화면은 다음 구현 단계에서 연결할 예정이에요.</Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.inkSoft },
});
