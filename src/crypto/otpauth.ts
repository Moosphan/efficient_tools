import type { OtpauthParsed, TotpAlgorithm, TotpEntry } from '../types';
import { generateId } from '../utils/id';

export function parseOtpauthUri(uri: string): OtpauthParsed {
  const url = new URL(uri);
  if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') {
    throw new Error('Only otpauth://totp/ URIs are supported');
  }

  const secret = url.searchParams.get('secret');
  if (!secret) throw new Error('Missing secret parameter in URI');

  const label = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const issuerParam = url.searchParams.get('issuer') || '';

  let account = label;
  const issuer = issuerParam;

  if (issuer && label.startsWith(issuer + ':')) {
    account = label.slice(issuer.length + 1).trim();
  } else if (label.includes(':')) {
    account = label.split(':').slice(1).join(':').trim();
  }

  const algorithmRaw = (url.searchParams.get('algorithm') || 'SHA1')
    .toUpperCase()
    .replace('-', '') as TotpAlgorithm;
  const algorithm: TotpAlgorithm = ['SHA1', 'SHA256', 'SHA512'].includes(algorithmRaw)
    ? algorithmRaw
    : 'SHA1';

  const digitsRaw = parseInt(url.searchParams.get('digits') || '6', 10);
  const digits: 6 | 8 = digitsRaw === 8 ? 8 : 6;

  const period = parseInt(url.searchParams.get('period') || '30', 10);

  return {
    secret: secret.replace(/\s/g, '').toUpperCase(),
    issuer,
    account,
    algorithm,
    digits,
    period: period >= 15 && period <= 120 ? period : 30,
  };
}

export function buildOtpauthUri(entry: TotpEntry): string {
  const label = entry.issuer
    ? `${entry.issuer}:${entry.account}`
    : entry.account;
  const params = new URLSearchParams({
    secret: entry.secret,
    algorithm: entry.algorithm,
    digits: String(entry.digits),
    period: String(entry.period),
  });
  if (entry.issuer) {
    params.set('issuer', entry.issuer);
  }
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function parsedToEntry(parsed: OtpauthParsed): TotpEntry {
  const now = Date.now();
  return {
    id: generateId(),
    issuer: parsed.issuer,
    account: parsed.account,
    secret: parsed.secret,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
    createdAt: now,
    updatedAt: now,
  };
}
