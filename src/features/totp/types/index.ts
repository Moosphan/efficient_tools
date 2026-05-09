export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface TotpEntry {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: number;
  createdAt: number;
  updatedAt: number;
}

export interface VaultMeta {
  version: number;
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
}

export interface EncryptedVault {
  iv: string;
  ciphertext: string;
}

export interface OtpauthParsed {
  secret: string;
  issuer: string;
  account: string;
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: number;
}

export type TotpResult = {
  code: string;
  remaining: number;
};

export type ModalType = null | 'add' | 'edit' | 'import' | 'backup' | 'confirm';
