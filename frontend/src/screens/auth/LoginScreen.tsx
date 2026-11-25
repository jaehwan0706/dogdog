import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../api/auth/authService';
import { AppButton } from '../../components/AppButton';
import { colors, radius, spacing, typography } from '../../theme';
import type { SocialProvider } from '../../types/auth';

type AuthMode = 'landing' | 'emailLogin' | 'signUp';

// 로그인에 성공하면 authStore 에 세션이 저장되고, App 이 그걸 보고 메인 화면으로 바꾼다
export function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialBusy, setSocialBusy] = useState(false);

  // 로그인 창을 닫거나 취소하면 조용히 원래 화면으로 돌아온다
  const loginWithSocial = async (provider: SocialProvider) => {
    if (socialBusy) return;
    setSocialBusy(true);
    setSocialError(null);
    try {
      await authService.socialLogin(provider);
    } catch (e) {
      setSocialError(e instanceof Error ? e.message : '소셜 로그인에 실패했어요.');
    } finally {
      setSocialBusy(false);
    }
  };

  if (mode !== 'landing') {
    return <EmailAuthScreen mode={mode} onBack={() => setMode('landing')} onSwitch={() => setMode(mode === 'emailLogin' ? 'signUp' : 'emailLogin')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTopLine}>
            <MaterialCommunityIcons name="paw" size={22} color={colors.orange} />
            <Text style={styles.brand}>댕산책</Text>
          </View>
          <View style={styles.heroArt}>
            <View style={[styles.artCircle, styles.artCircleLarge]} />
            <View style={[styles.artCircle, styles.artCircleSmall]} />
            <MaterialCommunityIcons name="dog" size={88} color={colors.ivory} />
          </View>
          <Text style={styles.title}>우리 아이와 걷는 시간이{`\n`}더 건강하고 즐거워져요.</Text>
          <Text style={styles.description}>반려견과 함께하는 산책의 모든 순간을 기록해보세요.</Text>
        </View>

        <View style={styles.actions}>
          <SocialButton disabled={socialBusy} icon="google" label="Google로 계속하기" onPress={() => loginWithSocial('google')} />
          <SocialButton disabled={socialBusy} icon="message-text" label="카카오로 계속하기" onPress={() => loginWithSocial('kakao')} />
          <SocialButton disabled={socialBusy} icon="email-outline" label="이메일로 로그인" onPress={() => setMode('emailLogin')} />
          <Pressable accessibilityRole="button" onPress={() => setMode('signUp')} style={styles.signupLink}>
            <Text style={styles.signupText}>계정이 없나요? <Text style={styles.signupAccent}>회원가입</Text></Text>
          </Pressable>
          {socialError ? <Text style={styles.errorText}>{socialError}</Text> : null}
          {socialBusy ? <Text style={styles.loginHint}>인증을 취소하려면 열린 창의 닫기 또는 뒤로가기를 눌러주세요.</Text> : null}
        </View>

        <Text style={styles.legal}>계속하면 이용약관 및 개인정보처리방침에 동의하게 됩니다.</Text>
      </View>
    </SafeAreaView>
  );
}

function EmailAuthScreen({ mode, onBack, onSwitch }: { mode: 'emailLogin' | 'signUp'; onBack: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';
  const canSubmit = email.trim() !== '' && password !== '' && (!isSignUp || name.trim() !== '');

  // 이 화면은 React Navigation 바깥의 로컬 상태로 열리므로 안드로이드 뒤로가기를 직접 처리한다.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isSignUp) {
        await authService.signup({ email: email.trim(), password, nickname: name.trim() });
      } else {
        await authService.login({ email: email.trim(), password });
      }
    } catch (e) {
      // 성공하면 App 이 로그인 화면을 내리므로 실패했을 때만 상태를 되돌린다
      setError(e instanceof Error ? e.message : '로그인하지 못했어요.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.formPage}>
        <Pressable accessibilityLabel="로그인 방법 선택으로 돌아가기" accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ivory} />
          <Text style={styles.backButtonText}>로그인 방법 선택</Text>
        </Pressable>
        <Text style={styles.formTitle}>{mode === 'emailLogin' ? '이메일로 로그인' : '계정 만들기'}</Text>
        <Text style={styles.formDescription}>{mode === 'emailLogin' ? '댕산책에 다시 오신 것을 환영해요.' : '댕산책과 함께 산책을 시작해보세요.'}</Text>
        <View style={styles.formFields}>
          {isSignUp ? <TextInput onChangeText={setName} placeholder="닉네임 (2~20자)" placeholderTextColor={colors.inkFaint} style={styles.input} value={name} /> : null}
          <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="이메일" placeholderTextColor={colors.inkFaint} style={styles.input} value={email} />
          <TextInput onChangeText={setPassword} onSubmitEditing={canSubmit && !submitting ? submit : undefined} placeholder={isSignUp ? '비밀번호 (영문+숫자 8자 이상)' : '비밀번호'} placeholderTextColor={colors.inkFaint} secureTextEntry style={styles.input} value={password} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton disabled={!canSubmit || submitting} label={submitting ? '잠시만요…' : isSignUp ? '회원가입' : '로그인'} onPress={submit} />
        </View>
        <Pressable accessibilityRole="button" onPress={onSwitch} style={styles.switchLink}>
          <Text style={styles.signupText}>{mode === 'emailLogin' ? '계정이 없나요? ' : '이미 계정이 있나요? '}<Text style={styles.signupAccent}>{mode === 'emailLogin' ? '회원가입' : '로그인'}</Text></Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SocialButton({ icon, label, disabled = false, onPress }: { icon: 'google' | 'message-text' | 'alpha-n-box' | 'email-outline'; label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.socialButton, disabled && styles.disabled, pressed && styles.pressed]}><MaterialCommunityIcons name={icon} size={20} color={colors.ivory} /><Text style={styles.socialText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.forestDeep },
  content: { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  hero: { flex: 1, justifyContent: 'center' },
  heroTopLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.section },
  brand: { ...typography.heading, color: colors.ivory },
  heroArt: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.forest, borderRadius: 120, height: 190, justifyContent: 'center', marginBottom: spacing.section, overflow: 'hidden', width: 190 },
  artCircle: { backgroundColor: colors.orange, borderRadius: 999, position: 'absolute' },
  artCircleLarge: { height: 150, right: -35, top: -30, width: 150 },
  artCircleSmall: { bottom: -18, height: 72, left: -12, width: 72 },
  title: { ...typography.display, color: colors.ivory },
  description: { ...typography.body, color: '#B9C4BA', marginTop: spacing.lg },
  actions: { gap: spacing.sm },
  socialButton: { alignItems: 'center', borderColor: '#526158', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 50 },
  socialText: { ...typography.body, color: colors.ivory, fontWeight: '700' },
  signupLink: { alignItems: 'center', paddingVertical: spacing.sm },
  signupText: { ...typography.body, color: colors.ivory },
  signupAccent: { color: colors.orange, fontWeight: '700' },
  legal: { ...typography.caption, color: '#8E9B91', paddingTop: spacing.lg, textAlign: 'center' },
  pressed: { opacity: 0.7 },
  formPage: { flex: 1, padding: spacing.xl },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.section, minHeight: 44 },
  backButtonText: { ...typography.body, color: colors.ivory, fontWeight: '700' },
  formTitle: { ...typography.display, color: colors.ivory },
  formDescription: { ...typography.body, color: '#B9C4BA', marginTop: spacing.sm },
  formFields: { gap: spacing.sm, marginTop: spacing.section },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 52, paddingHorizontal: spacing.lg },
  switchLink: { alignItems: 'center', marginTop: spacing.xl },
  errorText: { ...typography.caption, color: '#F2A7A5', textAlign: 'center' },
  loginHint: { ...typography.caption, color: '#B9C4BA', textAlign: 'center' },
  disabled: { opacity: 0.5 },
});
