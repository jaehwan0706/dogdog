import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../AppButton';
import { colors, radius, spacing, typography } from '../../theme';
import type { PhotoPin, PickedPhoto } from '../../types/photoPin';
import { formatMeetAt } from '../../utils/format';

const MEMO_MAX = 200;

// 화면 아래에서 올라오는 시트. 바깥(어두운 부분)을 누르면 닫힘
function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <View style={styles.sheet}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// 사진을 고른 뒤 저장 전 미리보기 + 메모 입력
export function PhotoPinCreateSheet({ photo, saving, onCancel, onSave }: {
  photo: PickedPhoto | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (memo: string) => void;
}) {
  const [memo, setMemo] = useState('');

  // 새 사진을 고를 때마다 메모 초기화
  useEffect(() => {
    if (photo) setMemo('');
  }, [photo]);

  return (
    <Sheet visible={photo !== null} onClose={saving ? () => {} : onCancel}>
      <Text style={styles.title}>사진 핀 남기기</Text>
      <Text style={styles.caption}>지금 있는 위치에 사진 핀이 생겨요. 나만 볼 수 있어요.</Text>
      {photo && <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />}
      <TextInput
        value={memo}
        onChangeText={setMemo}
        maxLength={MEMO_MAX}
        placeholder="한 줄 메모 (선택)"
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        editable={!saving}
      />
      <View style={styles.buttons}>
        <View style={styles.button}>
          <AppButton label="취소" variant="ghost" onPress={onCancel} disabled={saving} />
        </View>
        <View style={styles.button}>
          <AppButton label={saving ? '저장 중…' : '저장'} onPress={() => onSave(memo.trim())} disabled={saving} />
        </View>
      </View>
    </Sheet>
  );
}

// 지도에서 핀을 눌렀을 때 상세 + 삭제
export function PhotoPinDetailSheet({ pin, deleting, onClose, onDelete }: {
  pin: PhotoPin | null;
  deleting: boolean;
  onClose: () => void;
  onDelete: (pin: PhotoPin) => void;
}) {
  return (
    <Sheet visible={pin !== null} onClose={onClose}>
      {pin && (
        <>
          <Image source={{ uri: pin.imageUrl }} style={styles.photo} resizeMode="cover" />
          {pin.memo && <Text style={styles.memo}>{pin.memo}</Text>}
          <Text style={styles.caption}>{formatMeetAt(pin.createdAt)}</Text>
          <View style={styles.buttons}>
            <View style={styles.button}>
              <AppButton label={deleting ? '삭제 중…' : '삭제'} variant="ghost" onPress={() => onDelete(pin)} disabled={deleting} />
            </View>
            <View style={styles.button}>
              <AppButton label="닫기" onPress={onClose} />
            </View>
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.35)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.ink, ...typography.heading },
  caption: { color: colors.inkSoft, ...typography.caption },
  photo: { aspectRatio: 4 / 3, backgroundColor: colors.ivorySoft, borderRadius: radius.md, width: '100%' },
  memo: { color: colors.ink, ...typography.body },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 50, paddingHorizontal: spacing.lg, ...typography.body },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1 },
});
