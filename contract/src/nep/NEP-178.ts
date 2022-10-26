import { NearPromise } from 'near-sdk-js';

export interface NEP178 {
  nft_approve({
    token_id,
    account_id,
    msg,
  }: {
    token_id: string;
    account_id: string;
    msg?: string;
  }): void | NearPromise;

  nft_revoke({
    token_id,
    account_id,
  }: {
    token_id: string;
    account_id: string;
  }): void;

  nft_revoke_all({ token_id }: { token_id: string }): void;

  nft_is_approved({
    token_id,
    approval_id,
    approved_account_id,
  }: {
    token_id: string;
    approved_account_id: string;
    approval_id?: number;
  }): boolean;
}
