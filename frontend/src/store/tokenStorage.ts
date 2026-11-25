import * as SecureStore from 'expo-secure-store';

// 앱(iOS Keychain / Android Keystore)에 Refresh Token 을 보관한다. 웹은 tokenStorage.web.ts 가 대신 쓰임.
// Access Token 은 저장하지 않고 앱을 켤 때 Refresh Token 으로 새로 발급받는다.
const KEY = 'dangsanchaek.refreshToken';

export const tokenStorage = {
  load: () => SecureStore.getItemAsync(KEY).catch(() => null),
  save: (token: string) => SecureStore.setItemAsync(KEY, token).catch(() => {}),
  remove: () => SecureStore.deleteItemAsync(KEY).catch(() => {}),
};
