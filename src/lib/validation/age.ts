/**
 * 나이 계산 및 검증 유틸리티
 */

/**
 * 생년월일로부터 만 나이를 계산합니다.
 * @param birthDate 생년월일 (YYYY-MM-DD 형식)
 * @returns 만 나이
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * 최소 나이를 만족하는지 검증합니다.
 * @param birthDate 생년월일 (YYYY-MM-DD 형식)
 * @param minimumAge 최소 나이
 * @returns 최소 나이를 만족하면 true, 그렇지 않으면 false
 */
export function validateMinimumAge(birthDate: string, minimumAge: number): boolean {
  const age = calculateAge(birthDate);
  return age >= minimumAge;
}

/**
 * 인플루언서 최소 나이 상수
 */
export const MINIMUM_INFLUENCER_AGE = 14;
