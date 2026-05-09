export function formatCode(code: string): string {
  if (code.length === 8) {
    return code.slice(0, 4) + ' ' + code.slice(4);
  }
  return code.slice(0, 3) + ' ' + code.slice(3);
}

export function formatAccount(account: string, secret: string): string {
  if (account) return account;
  return secret.slice(0, 4) + '····';
}
