import { Contract } from ".";
import {Token} from "./nep/NEP-171";
import {NFTContractMetadata, TokenMetadata} from "./nep/NEP-177";



export type TokenInfo = {
    owner_id: string;
    approved_account_ids: { [accountId: string]: number };
    next_approval_id: number;
    royalty: { [accountId: string]: number };
}

export type JsonToken = Token & {
    metadata: TokenMetadata;
    approved_account_ids: { [accountId: string]: number };
    royalty: { [accountId: string]: number };
}

export function internalNftMetadata({
    contract
}:{
    contract: Contract
}): NFTContractMetadata {
    return contract.metadata;
}