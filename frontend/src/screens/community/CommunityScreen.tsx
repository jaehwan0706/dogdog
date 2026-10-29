import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { communityService } from '../../api/community/communityService';
import { PostCard, categoryLabel } from '../../components/community/PostCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { CommunityScreenProps } from '../../navigation/CommunityNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import type { PostCategory } from '../../types/community';

const filters: (PostCategory | undefined)[] = [undefined, 'FREE', 'WALK_MATE', 'CARE_SHARE'];

export function CommunityScreen({ navigation }: CommunityScreenProps<'CommunityHome'>) {
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const posts = useAsyncData(() => communityService.getPosts({ category, keyword }), [category, keyword]);

  // 상세·글쓰기에서 돌아오면 좋아요·댓글 수가 바뀌었을 수 있어 다시 불러옴 (첫 진입은 useAsyncData 가 처리)
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) posts.reload();
      focusedOnce.current = true;
    }, [posts.reload]),
  );

  const items = posts.data?.content ?? [];

  return (
    <Screen title="동네 댕친구" subtitle="우리 동네 보호자들과 산책 이야기를 나눠보세요.">
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={19} color={colors.inkSoft} />
        <TextInput
          onChangeText={setKeywordInput}
          onSubmitEditing={() => setKeyword(keywordInput.trim())}
          placeholder="게시글을 검색해보세요"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.searchInput}
          value={keywordInput}
        />
      </View>
      <View style={styles.filters}>
        {filters.map((value) => (
          <Pressable key={value ?? 'ALL'} accessibilityRole="button" accessibilityState={{ selected: category === value }} onPress={() => setCategory(value)} style={[styles.filter, category === value && styles.filterActive]}>
            <Text style={[styles.filterText, category === value && styles.filterTextActive]}>{value ? categoryLabel[value] : '전체'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('PostWrite')} style={styles.write}>
        <MaterialCommunityIcons name="pencil-plus-outline" size={20} color={colors.white} />
        <Text style={styles.writeText}>글쓰기</Text>
      </Pressable>
      {items.length > 0 && !posts.error
        ? items.map((post) => <PostCard key={post.id} post={post} onPress={() => navigation.navigate('PostDetail', { postId: post.id })} />)
        : <LoadState loading={posts.loading} error={posts.error} empty emptyText={keyword ? '검색 결과가 없어요.' : '아직 게시글이 없어요. 첫 글을 남겨보세요!'} onRetry={posts.reload} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: { color: colors.ink, flex: 1, minHeight: 45, ...typography.body },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 99, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.inkSoft, ...typography.label },
  filterTextActive: { color: colors.white },
  write: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.forest, borderRadius: 99, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  writeText: { color: colors.white, ...typography.label },
});
