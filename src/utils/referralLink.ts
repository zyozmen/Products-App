export const REFERRAL_REGISTER_BASE_URL = 'https://growshopp.netlify.app/register?ref=';

export function normalizeReferralCode(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function buildReferralLink(code: string): string {
  return `${REFERRAL_REGISTER_BASE_URL}${encodeURIComponent(code.trim())}`;
}
