import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchDogBreeds } from '../../data/dogBreeds';
import { colors, radius, spacing, typography } from '../../theme';

export function BreedAutocomplete({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => searchDogBreeds(value), [value]);

  const change = (text: string) => {
    onChange(text);
    setOpen(true);
  };

  const select = (breed: string) => {
    onChange(breed);
    setOpen(false);
  };

  return (
    <View>
      <View style={[styles.inputFrame, open && value.trim() && styles.inputFrameActive]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.inkFaint} />
        <TextInput
          accessibilityLabel="견종 검색"
          autoCapitalize="none"
          onChangeText={change}
          onFocus={() => setOpen(true)}
          placeholder="견종을 검색하세요 (예: 사모예드)"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          value={value}
        />
        {value ? (
          <Pressable accessibilityLabel="견종 입력 지우기" accessibilityRole="button" hitSlop={8} onPress={() => change('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>

      {open && value.trim() ? (
        <View style={styles.suggestionBox} accessibilityLiveRegion="polite">
          {suggestions.length ? suggestions.map((breed, index) => (
            <Pressable
              accessibilityRole="button"
              key={breed}
              onPress={() => select(breed)}
              style={({ pressed }) => [styles.suggestion, index < suggestions.length - 1 && styles.suggestionDivider, pressed && styles.suggestionPressed]}
            >
              <MaterialCommunityIcons name="dog-side" size={19} color={colors.forest} />
              <Text style={styles.suggestionText}>{breed}</Text>
              <MaterialCommunityIcons name="chevron-right" size={19} color={colors.inkFaint} />
            </Pressable>
          )) : (
            <View style={styles.emptySuggestion}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.inkFaint} />
              <Text style={styles.emptyText}>목록에 없어도 입력한 견종 그대로 저장할 수 있어요.</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputFrame: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 50, paddingHorizontal: spacing.md },
  inputFrameActive: { borderColor: colors.forest },
  input: { color: colors.ink, flex: 1, minHeight: 48, ...typography.body },
  suggestionBox: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.xs, overflow: 'hidden' },
  suggestion: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 46, paddingHorizontal: spacing.md },
  suggestionDivider: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionPressed: { backgroundColor: colors.forestSoft },
  suggestionText: { color: colors.ink, flex: 1, ...typography.body },
  emptySuggestion: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  emptyText: { color: colors.inkSoft, flex: 1, ...typography.caption },
});
