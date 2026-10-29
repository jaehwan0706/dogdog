// 날짜·이름 표시 공통 함수

// 받침 유무에 따라 조사 선택: withJosa('초롱', '과', '와') → 초롱과, withJosa('보리', '과', '와') → 보리와
export function withJosa(name: string, afterConsonant: string, afterVowel: string) {
  const last = name.charCodeAt(name.length - 1);
  const hasFinal = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? afterConsonant : afterVowel}`;
}

// 호격: 보리야 / 초롱아
export function callName(name: string) {
  return withJosa(name, '아', '야');
}

// 서버 LocalDateTime("2026-10-29T12:00:00") 은 시간대가 없어 기기 현지 시각으로 해석
export function timeAgo(dateTime: string) {
  const minutes = Math.floor((Date.now() - new Date(dateTime).getTime()) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / 60 / 24)}일 전`;
  return dateTime.slice(0, 10).replaceAll('-', '.');
}

export function formatMeetAt(dateTime: string) {
  const date = new Date(dateTime);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function dogAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth() - (now.getDate() < birth.getDate() ? 1 : 0);
  return months < 12 ? `${Math.max(months, 0)}개월` : `${Math.floor(months / 12)}살`;
}

export function dogSummary(dog: { breed: string | null; birthDate: string | null; weightKg: number | null }) {
  return [dog.breed, dogAge(dog.birthDate), dog.weightKg ? `${dog.weightKg}kg` : null].filter(Boolean).join(' · ') || '프로필을 채워주세요';
}
