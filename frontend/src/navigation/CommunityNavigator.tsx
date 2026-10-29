import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { PostDetailScreen } from '../screens/community/PostDetailScreen';
import { PostWriteScreen } from '../screens/community/PostWriteScreen';

// 커뮤니티 탭 내부 이동: 피드 → 게시글 상세(댓글·좋아요·참여) / 글쓰기
export type CommunityStackParamList = {
  CommunityHome: undefined;
  PostDetail: { postId: number };
  PostWrite: undefined;
};

export type CommunityScreenProps<Name extends keyof CommunityStackParamList> = NativeStackScreenProps<CommunityStackParamList, Name>;

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityHome" component={CommunityScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PostWrite" component={PostWriteScreen} />
    </Stack.Navigator>
  );
}
