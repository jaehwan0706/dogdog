import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { communityService } from '../../api/community/communityService';
import { moderationService } from '../../api/moderation/moderationService';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AuthorRow, RecruitBadge, categoryLabel } from '../../components/community/PostCard';
import { Screen } from '../../components/Screen';
import { LoadState } from '../../components/shop/ShopParts';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { CommunityScreenProps } from '../../navigation/CommunityNavigator';
import { authStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { Comment } from '../../types/community';
import { confirmAction, notify } from '../../utils/dialog';
import { timeAgo } from '../../utils/format';

export function PostDetailScreen({ navigation, route }: CommunityScreenProps<'PostDetail'>) {
  const { postId } = route.params;
  const post = useAsyncData(() => communityService.getPost(postId), [postId]);
  const comments = useAsyncData(() => communityService.getComments(postId), [postId]);
  const [commentInput, setCommentInput] = useState('');
  const [busy, setBusy] = useState(false);
  const myId = authStore.getSession()?.user.id;

  // 버튼 연타로 같은 요청이 겹치지 않게 하고, 실패하면 서버 메시지를 띄움
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      notify('요청을 처리하지 못했어요', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = () =>
    run(async () => {
      const current = post.data!;
      const result = current.likedByMe ? await communityService.unlike(postId) : await communityService.like(postId);
      post.setData({ ...current, likedByMe: result.liked, likeCount: result.likeCount });
    });

  const toggleJoin = () =>
    run(async () => {
      const current = post.data!;
      const result = current.participating ? await communityService.leave(postId) : await communityService.join(postId);
      post.setData({ ...current, participating: result.participating, recruit: { ...current.recruit!, participantCount: result.participantCount, status: result.status } });
    });

  const submitComment = () =>
    run(async () => {
      await communityService.createComment(postId, commentInput.trim());
      setCommentInput('');
      post.setData({ ...post.data!, commentCount: post.data!.commentCount + 1 });
      await comments.reload();
    });

  const deletePost = () =>
    confirmAction({ title: '게시글을 삭제할까요?', confirmText: '삭제', destructive: true, onConfirm: () => run(async () => {
      await communityService.deletePost(postId);
      navigation.goBack();
    }) });

  const deleteComment = (commentId: number) =>
    confirmAction({ title: '댓글을 삭제할까요?', confirmText: '삭제', destructive: true, onConfirm: () => run(async () => {
      await communityService.deleteComment(commentId);
      await comments.reload();
    }) });

  // 작성자 차단: 이후 서버가 이 사용자의 글·댓글을 빼고 내려주므로 목록으로 돌아간다
  const blockAuthor = () =>
    confirmAction({
      title: `${post.data!.author.nickname}님을 차단할까요?`,
      message: '이 사용자의 글과 댓글이 더 이상 보이지 않아요. 마이페이지에서 해제할 수 있어요.',
      confirmText: '차단',
      destructive: true,
      onConfirm: () => run(async () => {
        await moderationService.block(post.data!.author.id);
        navigation.goBack();
      }),
    });

  const reportPost = () => navigation.navigate('Report', { targetType: 'POST', targetId: postId, targetLabel: post.data!.title });
  const reportComment = (comment: Comment) => navigation.navigate('Report', { targetType: 'COMMENT', targetId: comment.id, targetLabel: comment.content });

  const data = post.data;

  return (
    <Screen title="게시글" onBack={navigation.goBack} headerRight={data?.mine ? (
      <Pressable accessibilityRole="button" accessibilityLabel="게시글 삭제" hitSlop={8} onPress={deletePost}>
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.inkSoft} />
      </Pressable>
    ) : data ? (
      <View style={styles.headerActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="게시글 신고" hitSlop={8} onPress={reportPost}>
          <MaterialCommunityIcons name="alarm-light-outline" size={22} color={colors.inkSoft} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="작성자 차단" hitSlop={8} onPress={blockAuthor}>
          <MaterialCommunityIcons name="account-cancel-outline" size={22} color={colors.inkSoft} />
        </Pressable>
      </View>
    ) : undefined}>
      {!data ? <LoadState loading={post.loading} error={post.error} onRetry={post.reload} /> : (
        <>
          {data.hidden ? (
            <View style={styles.hiddenBanner}>
              <MaterialCommunityIcons name="eye-off-outline" size={18} color={colors.coral} />
              <Text style={styles.hiddenText}>운영 정책에 따라 숨겨진 글이에요. 다른 사용자에게는 보이지 않아요.</Text>
            </View>
          ) : null}
          <AppCard>
            <AuthorRow nickname={data.author.nickname} meta={`${timeAgo(data.createdAt)} · ${categoryLabel[data.category]}`} />
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.body}>{data.content}</Text>
            {data.imageUrls.map((url) => <Image key={url} source={{ uri: url }} style={styles.image} resizeMode="cover" />)}
            {data.recruit ? <RecruitBadge recruit={data.recruit} /> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel={data.likedByMe ? '좋아요 취소' : '좋아요'} disabled={busy} onPress={toggleLike} style={styles.action}>
                <MaterialCommunityIcons name={data.likedByMe ? 'heart' : 'heart-outline'} size={20} color={data.likedByMe ? colors.coral : colors.inkSoft} />
                <Text style={styles.actionText}>{data.likeCount}</Text>
              </Pressable>
              <View style={styles.action}>
                <MaterialCommunityIcons name="comment-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.actionText}>{data.commentCount}</Text>
              </View>
            </View>
            {data.recruit && !data.mine && (data.participating || data.recruit.status === 'OPEN') ? (
              <View style={styles.join}>
                <AppButton disabled={busy} label={data.participating ? '참여 취소' : '같이 할래요'} variant={data.participating ? 'ghost' : 'secondary'} onPress={toggleJoin} />
              </View>
            ) : null}
          </AppCard>

          <Text style={styles.sectionTitle}>댓글</Text>
          {comments.data && comments.data.length > 0
            ? comments.data.map((comment) => <CommentItem key={comment.id} comment={comment} myId={myId} onDelete={deleteComment} onReport={reportComment} />)
            : <LoadState loading={comments.loading} error={comments.error} empty emptyText="첫 댓글을 남겨보세요." onRetry={comments.reload} />}
          <View style={styles.commentBox}>
            <TextInput maxLength={500} multiline onChangeText={setCommentInput} placeholder="댓글을 입력하세요" placeholderTextColor={colors.inkFaint} style={styles.commentInput} value={commentInput} />
            <Pressable accessibilityRole="button" accessibilityLabel="댓글 등록" disabled={!commentInput.trim() || busy} onPress={submitComment} style={[styles.send, (!commentInput.trim() || busy) && styles.sendDisabled]}>
              <MaterialCommunityIcons name="send" size={18} color={colors.white} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

function CommentItem({ comment, myId, onDelete, onReport, reply = false }: { comment: Comment; myId?: number; onDelete: (id: number) => void; onReport: (comment: Comment) => void; reply?: boolean }) {
  const canReport = !comment.deleted && !comment.hidden && comment.author !== null && comment.author.id !== myId;
  return (
    <View style={reply && styles.reply}>
      <AppCard>
        <View style={styles.commentHead}>
          <Text style={styles.commentAuthor}>{comment.author?.nickname ?? '알 수 없음'}</Text>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
          {!comment.deleted && comment.author?.id === myId ? (
            <Pressable accessibilityRole="button" accessibilityLabel="댓글 삭제" hitSlop={8} onPress={() => onDelete(comment.id)} style={styles.commentDelete}>
              <Text style={styles.commentDeleteText}>삭제</Text>
            </Pressable>
          ) : null}
          {canReport ? (
            <Pressable accessibilityRole="button" accessibilityLabel="댓글 신고" hitSlop={8} onPress={() => onReport(comment)} style={styles.commentDelete}>
              <Text style={styles.commentDeleteText}>신고</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.commentBody, (comment.deleted || comment.hidden) && styles.commentDeleted]}>{comment.content}</Text>
      </AppCard>
      {comment.replies.map((item) => <CommentItem key={item.id} comment={item} myId={myId} onDelete={onDelete} onReport={onReport} reply />)}
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", gap: spacing.lg },
  hiddenBanner: { alignItems: "center", backgroundColor: "#FBE3DA", borderRadius: radius.md, flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  hiddenText: { color: colors.coral, flex: 1, ...typography.label },
  title: { color: colors.ink, marginTop: spacing.lg, ...typography.title },
  body: { color: colors.ink, marginTop: spacing.sm, ...typography.body },
  image: { backgroundColor: colors.ivorySoft, borderRadius: radius.md, height: 200, marginTop: spacing.md, width: '100%' },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  action: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  actionText: { color: colors.inkSoft, ...typography.label },
  join: { marginTop: spacing.lg },
  sectionTitle: { color: colors.ink, ...typography.heading },
  reply: { marginLeft: spacing.xl, marginTop: spacing.sm },
  commentHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  commentAuthor: { color: colors.ink, ...typography.label },
  commentTime: { color: colors.inkFaint, ...typography.caption },
  commentDelete: { marginLeft: 'auto' },
  commentDeleteText: { color: colors.inkFaint, ...typography.caption },
  commentBody: { color: colors.ink, marginTop: spacing.xs, ...typography.body },
  commentDeleted: { color: colors.inkFaint },
  commentBox: { alignItems: 'flex-end', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  commentInput: { color: colors.ink, flex: 1, maxHeight: 120, minHeight: 40, paddingHorizontal: spacing.sm, ...typography.body },
  send: { alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  sendDisabled: { opacity: 0.4 },
});
