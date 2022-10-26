export type Payout = {
  payout: { [accountId: string]: string };
};

export interface NEP199 {
  nft_payout({
    token_id,
    balance,
    max_len_payout,
  }: {
    token_id: string;
    balance: bigint;
    max_len_payout: number;
  }): Payout;

  nft_transfer_payout({
    receiver_id,
    token_id,
    approval_id,
    memo,
    balance,
    max_len_payout,
  }: {
    receiver_id: string;
    token_id: string;
    approval_id?: number;
    memo: string;
    balance: bigint;
    max_len_payout: number;
  }): Payout;
}
