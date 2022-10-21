
import { NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet } from 'near-sdk-js'
import {internalNftMetadata, JsonToken} from './metadata';
import { internalMint } from './mint';
import { internalNftTokens, internalSupplyForOwner, internalTokensForOwner, internalTotalSupply } from './enumeration';
import { internalNftToken, internalNftTransfer, internalNftTransferCall, internalResolveTransfer } from './nft_core';
import { internalNftApprove, internalNftIsApproved, internalNftRevoke, internalNftRevokeAll } from './approval';
import { internalNftPayout, internalNftTransferPayout } from './royalty';
import {NEP171} from "./nep/NEP-171";
import {NEP177, NFTContractMetadata} from "./nep/NEP-177";
import {NEP178} from "./nep/NEP-178";
import {NEP199} from "./nep/NEP-199";
import {NEP181} from "./nep/NEP-181";
import {Counter} from "./lib/Counter";

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

@NearBindgen({})
export class Contract implements NEP171, NEP177, NEP178, NEP181, NEP199{
    tokensPerOwner: LookupMap = new LookupMap("tokensPerOwner");
    tokensById: LookupMap = new LookupMap("tokensById");
    tokenMetadataById: UnorderedMap = new UnorderedMap("tokenMetadataById");
    metadata: NFTContractMetadata = {
        spec: "nft-1.0.0",
        name: "NFT Tutorial Contract",
        symbol: "GOTEAM"
    } ;
    counter: Counter;


    @call({})
    airdrop({ receiver_id, count }: {receiver_id?: string, count: number}): void {
        return internalMint({ contract: this, count, receiverId: receiver_id ?? near.predecessorAccountId() });
    }

    @view({})
    nft_token({ token_id }: {token_id: string}): JsonToken | null {
        return internalNftToken({ contract: this, tokenId: token_id });
    }

    @call({})
    nft_transfer({ receiver_id, token_id, approval_id, memo }: { receiver_id: string, token_id: string, approval_id?: number, memo?: string}): void {
        return internalNftTransfer({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo });
    }

    @call({})
    nft_transfer_call({ receiver_id, token_id, approval_id, memo, msg }: { receiver_id: string, token_id: string, approval_id?: number, memo?: string, msg: string}): void {
        return internalNftTransferCall({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, msg: msg });
    }

    @call({})
    nft_resolve_transfer({ authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo }): boolean {
        return internalResolveTransfer({ contract: this, authorizedId: authorized_id, ownerId: owner_id, receiverId: receiver_id, tokenId: token_id, approvedAccountIds: approved_account_ids, memo: memo });
    }

    @view({})
    nft_is_approved({ token_id, approved_account_id, approval_id }: { token_id: string, approved_account_id: string, approval_id?: number }) {
        return internalNftIsApproved({ contract: this, tokenId: token_id, approvedAccountId: approved_account_id, approvalId: approval_id });
    }

    @call({})
    nft_approve({ token_id, account_id, msg }: {token_id: string, account_id: string, msg: string}) {
        return internalNftApprove({ contract: this, tokenId: token_id, accountId: account_id, msg: msg });
    }

    @view({})
    nft_payout({ token_id, balance, max_len_payout }: {token_id: string, balance: bigint, max_len_payout: number}) {
        return internalNftPayout({ contract: this, tokenId: token_id, balance: balance, maxLenPayout: max_len_payout });
    }

    @call({payableFunction: true})
    nft_transfer_payout({ receiver_id, token_id, approval_id, memo, balance, max_len_payout }: {receiver_id: string, token_id: string, approval_id?: number, memo: string, balance: bigint, max_len_payout: number}) {
        return internalNftTransferPayout({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, balance: balance, maxLenPayout: max_len_payout });
    }

    @call({})
    nft_revoke({ token_id, account_id }: {token_id: string, account_id: string}) {
        return internalNftRevoke({ contract: this, tokenId: token_id, accountId: account_id });
    }

    @call({})
    nft_revoke_all({ token_id }:{token_id: string}) {
        return internalNftRevokeAll({ contract: this, tokenId: token_id });
    }

    @view({})
    nft_total_supply(): number {
        return internalTotalSupply({ contract: this });
    }

    @view({})
    nft_tokens({ from_index, limit }: { from_index: string, limit: number }) {
        return internalNftTokens({ contract: this, fromIndex: from_index, limit: limit });
    }

    @view({})
    nft_tokens_for_owner({ account_id, from_index, limit }: { account_id: string, from_index: string, limit: number}) {
        return internalTokensForOwner({ contract: this, accountId: account_id, fromIndex: from_index, limit: limit });
    }

    @view({})
    nft_supply_for_owner({ account_id }: { account_id: string}): number {
        return internalSupplyForOwner({ contract: this, accountId: account_id });
    }


    @view({})
    nft_metadata(): NFTContractMetadata {
        return internalNftMetadata({ contract: this });
    }
}