import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { WalkScreen } from '../screens/walk/WalkScreen';
import { WalkResultScreen } from '../screens/walk/WalkResultScreen';
import { CommunityNavigator, type CommunityStackParamList } from './CommunityNavigator';
import { ShopNavigator } from './ShopNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { colors, typography } from '../theme';

export type RootTabParamList = {
  홈: undefined;
  지도: undefined;
  커뮤니티: NavigatorScreenParams<CommunityStackParamList> | undefined;
  마켓: undefined;
  프로필: undefined;
};

// 탭 위에 전체 화면으로 띄우는 화면: 산책 중(하단 탭 없이) → 산책 결과
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  Walk: undefined;
  WalkResult: { walkId: number };
};

export type RootScreenProps<Name extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Name>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons = {
  홈: 'home-outline',
  지도: 'map-outline',
  커뮤니티: 'account-group-outline',
  마켓: 'shopping-outline',
  프로필: 'account-circle-outline',
} as const;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { ...typography.caption, marginBottom: 4 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 72, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="홈" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.홈} size={22} color={color} /> }} />
      <Tab.Screen name="지도" component={MapScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.지도} size={22} color={color} /> }} />
      <Tab.Screen name="커뮤니티" component={CommunityNavigator} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.커뮤니티} size={22} color={color} /> }} />
      <Tab.Screen name="마켓" component={ShopNavigator} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.마켓} size={22} color={color} /> }} />
      <Tab.Screen name="프로필" component={ProfileNavigator} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.프로필} size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        {/* 산책 중에는 옆으로 밀어서 닫히지 않게 함 (나가기는 화면 안의 버튼으로만) */}
        <Stack.Screen name="Walk" component={WalkScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="WalkResult" component={WalkResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
