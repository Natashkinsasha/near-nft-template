import {EventLogData} from "./NEP-297";

export type Token = {
    token_id: string,
    owner_id: string,
}

export type NftTransferEventLogData = EventLogData<"nft_transfer", {
    authorized_id?: string,
    old_owner_id: string,
    new_owner_id: string,
    token_ids: string[],
    memo?: string,
}[]>

export type NftMintEventLogData = EventLogData<"nft_mint", {
    owner_id: string,
    token_ids: string[],
}[]>





export interface NEP171{
    nft_transfer({receiver_id, token_id, approval_id, memo}:{ receiver_id: string, token_id: string, approval_id?: number, memo?: string}): void;

    nft_transfer_call({receiver_id, token_id, approval_id, memo, msg}:{ receiver_id: string, token_id: string, approval_id?: number, memo?: string, msg: string}): void;

    nft_token({token_id}:{token_id: string}): Token|null;

    nft_resolve_transfer({owner_id, receiver_id, token_id, approved_account_ids}:{ owner_id: string, receiver_id: string, token_id: string, approved_account_ids?: Record<string, number>}): boolean;
}