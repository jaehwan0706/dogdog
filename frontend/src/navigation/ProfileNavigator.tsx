import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DogEditScreen } from '../screens/profile/DogEditScreen';
import { MyPostsScreen } from '../screens/profile/MyPostsScreen';

// 프로필 탭 내부 이동: 마이페이지 → 반려견 추가/수정, 내가 쓴 글
export type ProfileStackParamList = {
  ProfileHome: undefined;
  DogEdit: { dogId?: number }; // 없으면 새로 추가
  MyPosts: undefined;
};

export type ProfileScreenProps<Name extends keyof ProfileStackParamList> = NativeStackScreenProps<ProfileStackParamList, Name>;

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="DogEdit" component={DogEditScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
    </Stack.Navigator>
  );
}
