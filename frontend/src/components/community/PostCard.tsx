import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../AppCard';
import { colors, radius, spacing, typography } from '../../theme';
import type { PostCategory, PostSummary, RecruitInfo } from '../../types/community';
import { formatMeetAt, timeAgo } from '../../utils/format';

export const categoryLabel: Record<PostCategory, string> = { FREE: '자유', WALK_MATE: '산책메이트', CARE_SHARE: '케어 품앗이' };

export function PostCard({ post, onPress }: { post: PostSummary; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <AppCard>
        <AuthorRow nickname={post.author.nickname} meta={`${timeAgo(post.createdAt)} · ${categoryLabel[post.category]}`} />
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.body} numberOfLines={3}>{post.contentPreview}</Text>
        {post.recruit ? <RecruitBadge recruit={post.recruit} /> : null}
        {post.thumbnailUrl ? <Image source={{ uri: post.thumbnailUrl }} style={styles.image} resizeMode="cover" /> : null}
        <View style={styles.reactions}>
          <Reaction icon={post.likedByMe ? 'heart' : 'heart-outline'} value={post.likeCount} active={post.likedByMe} />
          <Reaction icon="comment-outline" value={post.commentCount} />
        </View>
      </AppCard>
    </Pressable>
  );
}

export function AuthorRow({ nickname, meta }: { nickname: string; meta: string }) {
  return (
    <View style={styles.head}>
      <View style={styles.avatar}><MaterialCommunityIcons name="paw" size={17} color={colors.white} /></View>
      <View style={styles.flex}>
        <Text style={styles.author}>{nickname}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </View>
  );
}

export function RecruitBadge({ recruit }: { recruit: RecruitInfo }) {
  const closed = recruit.status === 'CLOSED';
  return (
    <View style={styles.recruit}>
      <MaterialCommunityIcons name="calendar-clock" size={15} color={colors.forest} />
      <Text style={styles.recruitText} numberOfLines={1}>
        {formatMeetAt(recruit.meetAt)}{recruit.placeName ? ` · ${recruit.placeName}` : ''}
      </Text>
      <Text style={[styles.recruitCount, closed && styles.recruitClosed]}>
        {closed ? '모집 마감' : `${recruit.participantCount}/${recruit.maxParticipants}명`}
      </Text>
    </View>
  );
}

export function Reaction({ icon, value, active = false }: { icon: 'heart' | 'heart-outline' | 'comment-outline'; value: number; active?: boolean }) {
  return (
    <View style={styles.reaction}>
      <MaterialCommunityIcons name={icon} size={17} color={active ? colors.coral : colors.inkSoft} />
      <Text style={styles.reactionText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  avatar: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: 99, height: 34, justifyContent: 'center', width: 34 },
  author: { color: colors.ink, ...typography.label },
  meta: { color: colors.inkFaint, marginTop: 2, ...typography.caption },
  title: { color: colors.ink, marginTop: spacing.lg, ...typography.heading },
  body: { color: colors.inkSoft, marginTop: spacing.xs, ...typography.body },
  image: { backgroundColor: colors.ivorySoft, borderRadius: radius.md, height: 170, marginTop: spacing.lg, width: '100%' },
  recruit: { alignItems: 'center', backgroundColor: colors.forestSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.sm },
  recruitText: { color: colors.forest, flex: 1, ...typography.label },
  recruitCount: { color: colors.forest, ...typography.label, fontWeight: '800' },
  recruitClosed: { color: colors.inkFaint },
  reactions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  reaction: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  reactionText: { color: colors.inkSoft, ...typography.caption },
});
