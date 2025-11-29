import { User } from './storage';

const DEFAULT_DOMAIN = 'hubisck.com';

export function getBaseUrl(user: User | null | undefined): string {
  if (user?.customDomain && user.customDomainVerified) {
    return `https://${user.customDomain}`;
  }
  return `https://${DEFAULT_DOMAIN}`;
}

export function getFullUrl(user: User | null | undefined, slug: string): string {
  return `${getBaseUrl(user)}/${slug}`;
}

export function getUrlPreview(customDomain: string | null, customDomainVerified: boolean, slug: string): string {
  if (customDomain && customDomainVerified) {
    return `https://${customDomain}/${slug || 'your-slug'}`;
  }
  return `https://${DEFAULT_DOMAIN}/${slug || 'your-slug'}`;
}

export function getDomainForDisplay(user: User | null | undefined): string {
  if (user?.customDomain && user.customDomainVerified) {
    return user.customDomain;
  }
  return DEFAULT_DOMAIN;
}
