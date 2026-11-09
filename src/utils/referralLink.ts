export const REFERRAL_REGISTER_BASE_URL = 'https://growshopp.netlify.app/register?ref=';

export function buildReferralLink(code: string): string {
  return `${REFERRAL_REGISTER_BASE_URL}${encodeURIComponent(code.trim())}`;
}
