import { communityService } from '../../api/community/communityService';
import { PostCard } from '../../components/community/PostCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ProfileScreenProps } from '../../navigation/ProfileNavigator';

export function MyPostsScreen({ navigation }: ProfileScreenProps<'MyPosts'>) {
  const posts = useAsyncData(() => communityService.getMyPosts(), []);
  const items = posts.data?.content ?? [];

  // 상세는 커뮤니티 탭의 화면을 그대로 쓴다
  const openPost = (postId: number) => navigation.getParent()?.navigate('커뮤니티', { screen: 'PostDetail', params: { postId }, initial: false });

  return (
    <Screen title="내가 쓴 글" onBack={navigation.goBack}>
      {items.length > 0 && !posts.error
        ? items.map((post) => <PostCard key={post.id} post={post} onPress={() => openPost(post.id)} />)
        : <LoadState loading={posts.loading} error={posts.error} empty emptyText="아직 작성한 글이 없어요." onRetry={posts.reload} />}
    </Screen>
  );
}
