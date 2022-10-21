import {Token} from "./NEP-171";


export interface NEP181{

    nft_total_supply(): number;

    nft_tokens({from_index, limit}:{ from_index?: string, limit?: number}): Token[];

    nft_supply_for_owner({ account_id }:{ account_id: string }): number;

    nft_tokens_for_owner({account_id, from_index, limit}:{ account_id: string, from_index?: string, limit?: number }): Token[]
}