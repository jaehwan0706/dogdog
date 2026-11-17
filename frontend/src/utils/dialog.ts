import { Alert, Platform } from 'react-native';

// react-native-web 의 Alert 는 버튼 콜백이 동작하지 않아 웹에서는 브라우저 기본 대화상자를 쓴다

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction({ title, message, confirmText, cancelText = '닫기', destructive = false, onConfirm }: {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  if (Platform.OS === 'web') {
    if (window.confirm(message ? `${title}\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
