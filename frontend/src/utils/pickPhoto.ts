import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import type { PickedPhoto } from '../types/photoPin';
import { confirmAction } from './dialog';

export type PhotoSource = 'camera' | 'library';

// 서버 업로드 한도(10MB) 안에 들어오도록 화질을 낮춰서 받는다
const QUALITY = 0.7;

// 카메라로 찍거나 앨범에서 고른 사진 1장. 취소했거나 권한이 없으면 null
export async function pickPhoto(source: PhotoSource): Promise<PickedPhoto | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      confirmAction({
        title: '카메라 권한이 필요해요',
        message: '설정에서 카메라 권한을 허용하면 사진 핀을 남길 수 있어요.',
        confirmText: '설정 열기',
        onConfirm: () => Linking.openSettings(),
      });
      return null;
    }
  }
  // 앨범은 시스템 사진 선택기를 써서 별도 권한 요청이 필요 없음 (iOS 14+, Android 13+)
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: QUALITY };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  const asset = result.canceled ? null : result.assets[0];
  if (!asset) {
    return null;
  }
  const mimeType = asset.mimeType ?? 'image/jpeg';
  return {
    uri: asset.uri,
    mimeType,
    fileName: asset.fileName ?? `photo.${mimeType.split('/')[1] ?? 'jpg'}`,
  };
}
