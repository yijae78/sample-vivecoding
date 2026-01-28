/**
 * 채널 검증 유틸리티 (URL 패턴 검증 + 중복 검사 통합)
 */

/**
 * 채널 유형
 */
export type ChannelType = 'naver' | 'youtube' | 'instagram' | 'threads';

/**
 * 채널 입력 타입
 */
export interface ChannelInput {
  channelType: ChannelType;
  channelName: string;
  channelUrl: string;
}

/**
 * 채널 유형별 URL 패턴 맵
 */
const CHANNEL_URL_PATTERNS: Record<ChannelType, RegExp> = {
  naver: /^https?:\/\/(blog\.naver\.com|m\.blog\.naver\.com)\/.+/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
  threads: /^https?:\/\/(www\.)?threads\.net\/@.+/i,
};

/**
 * 채널 유형별 URL 패턴을 반환합니다.
 * @param channelType 채널 유형
 * @returns 정규식 패턴 또는 null
 */
export function getChannelUrlPattern(channelType: ChannelType): RegExp | null {
  return CHANNEL_URL_PATTERNS[channelType] ?? null;
}

/**
 * 채널 URL이 해당 채널 유형의 패턴과 일치하는지 검증합니다.
 * @param channelType 채널 유형
 * @param url 채널 URL
 * @returns 패턴과 일치하면 true, 그렇지 않으면 false
 */
export function validateChannelUrl(channelType: ChannelType, url: string): boolean {
  const pattern = getChannelUrlPattern(channelType);
  if (!pattern) {
    return false;
  }
  return pattern.test(url);
}

/**
 * 채널 배열에서 중복된 채널 유형이 있는지 검사합니다.
 * @param channels 채널 배열
 * @returns 중복이 있으면 true, 없으면 false
 */
export function checkDuplicateChannels(channels: ChannelInput[]): boolean {
  const channelTypes = channels.map((channel) => channel.channelType);
  const uniqueTypes = new Set(channelTypes);
  return channelTypes.length !== uniqueTypes.size;
}
