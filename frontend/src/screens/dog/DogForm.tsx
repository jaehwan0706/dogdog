import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { dogService } from '../../api/dog/dogService';
import { AppButton } from '../../components/AppButton';
import { dogStore } from '../../store/dogStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { Dog, DogGender, DogInput } from '../../types/dog';

// 반려견 등록(온보딩·추가)과 수정에서 같이 쓰는 입력 폼. 저장에 성공하면 dogStore 에 반영하고 onSaved 호출
export function DogForm({ dog, submitLabel, onSaved }: { dog?: Dog; submitLabel: string; onSaved: (dog: Dog) => void }) {
  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState(dog?.breed ?? '');
  const [gender, setGender] = useState<DogGender | undefined>(dog?.gender ?? undefined);
  const [birthDate, setBirthDate] = useState(dog?.birthDate ?? '');
  const [weight, setWeight] = useState(dog?.weightKg ? String(dog.weightKg) : '');
  const [neutered, setNeutered] = useState<boolean | undefined>(dog?.neutered ?? undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('생일은 2023-05-01 형식으로 입력해 주세요.');
      return;
    }
    const weightKg = weight ? Number(weight) : undefined;
    if (weightKg !== undefined && !(weightKg > 0)) {
      setError('몸무게는 숫자로 입력해 주세요.');
      return;
    }
    const input: DogInput = { name: name.trim(), breed: breed.trim() || undefined, gender, birthDate: birthDate || undefined, weightKg, neutered };
    setSaving(true);
    setError(null);
    try {
      const saved = dog ? await dogService.updateDog(dog.id, input) : await dogService.createDog(input);
      dogStore.upsert(saved);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Field label="이름 *"><TextInput onChangeText={setName} placeholder="예: 보리" placeholderTextColor={colors.inkFaint} style={styles.input} value={name} /></Field>
      <Field label="견종"><TextInput onChangeText={setBreed} placeholder="예: 골든 리트리버" placeholderTextColor={colors.inkFaint} style={styles.input} value={breed} /></Field>
      <Field label="성별">
        <View style={styles.choices}>
          <Choice label="남아" active={gender === 'MALE'} onPress={() => setGender('MALE')} />
          <Choice label="여아" active={gender === 'FEMALE'} onPress={() => setGender('FEMALE')} />
        </View>
      </Field>
      <Field label="생일"><TextInput keyboardType="numbers-and-punctuation" maxLength={10} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.inkFaint} style={styles.input} value={birthDate} /></Field>
      <Field label="몸무게 (kg)"><TextInput keyboardType="decimal-pad" onChangeText={setWeight} placeholder="예: 8.5" placeholderTextColor={colors.inkFaint} style={styles.input} value={weight} /></Field>
      <Field label="중성화">
        <View style={styles.choices}>
          <Choice label="했어요" active={neutered === true} onPress={() => setNeutered(true)} />
          <Choice label="안 했어요" active={neutered === false} onPress={() => setNeutered(false)} />
        </View>
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={!name.trim() || saving} label={saving ? '저장 중…' : submitLabel} onPress={save} />
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.inkSoft },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 50, paddingHorizontal: spacing.lg },
  choices: { flexDirection: 'row', gap: spacing.sm },
  choice: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, minHeight: 46, justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  choiceText: { ...typography.body, color: colors.inkSoft, fontWeight: '600' },
  choiceTextActive: { color: colors.white },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
