import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DogEditScreen } from '../screens/profile/DogEditScreen';
import { MyPostsScreen } from '../screens/profile/MyPostsScreen';
import { BlockedUsersScreen } from '../screens/profile/BlockedUsersScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminProductsScreen } from '../screens/admin/AdminProductsScreen';
import { AdminProductEditScreen } from '../screens/admin/AdminProductEditScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';

// 프로필 탭 내부 이동: 마이페이지 → 반려견 추가/수정, 내가 쓴 글, 차단 목록, (ADMIN) 관리자 메뉴
export type ProfileStackParamList = {
  ProfileHome: undefined;
  DogEdit: { dogId?: number }; // 없으면 새로 추가
  MyPosts: undefined;
  BlockedUsers: undefined;
  AdminHome: undefined;
  AdminReports: undefined;
  AdminUsers: undefined;
  AdminProducts: undefined;
  AdminProductEdit: { productId?: number }; // 없으면 새로 등록
  AdminOrders: undefined;
};

export type ProfileScreenProps<Name extends keyof ProfileStackParamList> = NativeStackScreenProps<ProfileStackParamList, Name>;

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="DogEdit" component={DogEditScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="AdminProductEdit" component={AdminProductEditScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
    </Stack.Navigator>
  );
}
