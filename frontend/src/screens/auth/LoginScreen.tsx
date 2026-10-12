import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { colors, radius, spacing, typography } from '../../theme';

type LoginScreenProps = { onLogin: () => void };
type AuthMode = 'landing' | 'emailLogin' | 'signUp';

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('landing');

  if (mode !== 'landing') {
    return <EmailAuthScreen mode={mode} onBack={() => setMode('landing')} onSubmit={onLogin} onSwitch={() => setMode(mode === 'emailLogin' ? 'signUp' : 'emailLogin')} />;
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
          <SocialButton icon="google" label="Google로 계속하기" onPress={onLogin} />
          <SocialButton icon="message-text" label="카카오로 계속하기" onPress={onLogin} />
          <SocialButton icon="alpha-n-box" label="네이버로 계속하기" onPress={onLogin} />
          <SocialButton icon="email-outline" label="이메일로 로그인" onPress={() => setMode('emailLogin')} />
          <Pressable accessibilityRole="button" onPress={() => setMode('signUp')} style={styles.signupLink}>
            <Text style={styles.signupText}>계정이 없나요? <Text style={styles.signupAccent}>회원가입</Text></Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>계속하면 이용약관 및 개인정보처리방침에 동의하게 됩니다.</Text>
      </View>
    </SafeAreaView>
  );
}

function EmailAuthScreen({ mode, onBack, onSubmit, onSwitch }: { mode: 'emailLogin' | 'signUp'; onBack: () => void; onSubmit: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.formPage}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ivory} />
        </Pressable>
        <Text style={styles.formTitle}>{mode === 'emailLogin' ? '이메일로 로그인' : '계정 만들기'}</Text>
        <Text style={styles.formDescription}>{mode === 'emailLogin' ? '댕산책에 다시 오신 것을 환영해요.' : '댕산책과 함께 산책을 시작해보세요.'}</Text>
        <View style={styles.formFields}>
          {mode === 'signUp' ? <TextInput onChangeText={setName} placeholder="이름" placeholderTextColor={colors.inkFaint} style={styles.input} value={name} /> : null}
          <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="이메일" placeholderTextColor={colors.inkFaint} style={styles.input} value={email} />
          <TextInput onChangeText={setPassword} placeholder="비밀번호" placeholderTextColor={colors.inkFaint} secureTextEntry style={styles.input} value={password} />
          <AppButton label={mode === 'emailLogin' ? '로그인' : '회원가입'} onPress={onSubmit} />
        </View>
        <Pressable accessibilityRole="button" onPress={onSwitch} style={styles.switchLink}>
          <Text style={styles.signupText}>{mode === 'emailLogin' ? '계정이 없나요? ' : '이미 계정이 있나요? '}<Text style={styles.signupAccent}>{mode === 'emailLogin' ? '회원가입' : '로그인'}</Text></Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SocialButton({ icon, label, onPress }: { icon: 'google' | 'message-text' | 'alpha-n-box' | 'email-outline'; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}><MaterialCommunityIcons name={icon} size={20} color={colors.ivory} /><Text style={styles.socialText}>{label}</Text></Pressable>;
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
  backButton: { marginBottom: spacing.section },
  formTitle: { ...typography.display, color: colors.ivory },
  formDescription: { ...typography.body, color: '#B9C4BA', marginTop: spacing.sm },
  formFields: { gap: spacing.sm, marginTop: spacing.section },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, minHeight: 52, paddingHorizontal: spacing.lg },
  switchLink: { alignItems: 'center', marginTop: spacing.xl },
});
