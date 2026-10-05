import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { colors, typography } from '../theme';

export type RootTabParamList = {
  홈: undefined;
  지도: undefined;
  커뮤니티: undefined;
  마켓: undefined;
  프로필: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons = {
  홈: 'home-outline',
  지도: 'map-outline',
  커뮤니티: 'account-group-outline',
  마켓: 'shopping-outline',
  프로필: 'account-circle-outline',
} as const;

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.forest,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarLabelStyle: { ...typography.caption, marginBottom: 4 },
          tabBarStyle: { backgroundColor: colors.ivory, borderTopColor: colors.line, height: 68 },
        }}
      >
        <Tab.Screen name="홈" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.홈} size={22} color={color} /> }} />
        <Tab.Screen name="지도" component={MapScreen} options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.지도} size={22} color={color} /> }} />
        <Tab.Screen name="커뮤니티" options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.커뮤니티} size={22} color={color} /> }}>
          {() => <PlaceholderScreen title="동네 댕친구" description="산책 이야기를 나누고 친구를 만나보세요." />}
        </Tab.Screen>
        <Tab.Screen name="마켓" options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.마켓} size={22} color={color} /> }}>
          {() => <PlaceholderScreen title="댕마켓" description="마켓은 핵심 산책 기능 이후 연결할 예정이에요." />}
        </Tab.Screen>
        <Tab.Screen name="프로필" options={{ tabBarIcon: ({ color }) => <MaterialCommunityIcons name={tabIcons.프로필} size={22} color={color} /> }}>
          {() => <PlaceholderScreen title="마이페이지" description="보리의 산책 기록과 프로필을 관리해보세요." />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
