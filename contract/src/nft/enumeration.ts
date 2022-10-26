import {Contract, JsonToken} from "./index";
import { restoreOwners } from "./internal";
import { internalNftToken } from "./nft_core";
import {near, UnorderedSet} from "near-sdk-js";

//Query for the total supply of NFTs on the contract
export function internalTotalSupply({
    contract
}:{
    contract: Contract
}): number {
    //return the length of the token metadata by ID
    return contract.tokenMetadataById.length;
}

//Query for nft tokens on the contract regardless of the owner using pagination
export function internalNftTokens({
    contract,
    fromIndex,
    limit
}:{ 
    contract: Contract, 
    fromIndex?: string, 
    limit?: number
}): JsonToken[] {
    const tokens: JsonToken[] = [];

    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    const start = fromIndex ? parseInt(fromIndex) : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    const max = limit ? limit : 50;

    const keys = contract.tokenMetadataById.toArray();
    // Paginate through the keys using the fromIndex and limit
    for (let i = start; i < keys.length && i < start + max; i++) {
        // get the token object from the keys
        let jsonToken = internalNftToken({contract, tokenId: keys[i][0]});
        if(jsonToken){
            tokens.push(jsonToken);
        }
    }
    return tokens;
}

//get the total supply of NFTs for a given owner
export function internalSupplyForOwner({
    contract,
    accountId
}:{
    contract: Contract, 
    accountId: string
}): number {
    //get the set of tokens for the passed in owner
    const tokens = restoreOwners(contract.tokensPerOwner.get(accountId)  as UnorderedSet | null);
    //if there isn't a set of tokens for the passed in account ID, we'll return 0
    if (!tokens) {
        return 0
    }

    //if there is some set of tokens, we'll return the length 
    return tokens.length;
}

//Query for all the tokens for an owner
export function internalTokensForOwner({
    contract,
    accountId,
    fromIndex,
    limit
}:{
    contract: Contract, 
    accountId: string,
    fromIndex?: string, 
    limit?: number
}): JsonToken[] {
    //get the set of tokens for the passed in owner
    const tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId) as UnorderedSet | null);
    //if there isn't a set of tokens for the passed in account ID, we'll return 0
    if (!tokenSet) {
        return [];
    }
    
    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    const start = fromIndex ? parseInt(fromIndex) : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    const max = limit ? limit : 50;

    const keys = tokenSet.toArray();
    const tokens: JsonToken[] = [];
    for(let i = start; i < start + max; i++) {
        if(i >= keys.length) {
            break;
        }
        const token = internalNftToken({contract, tokenId: keys[i]});
        if(token){
            tokens.push(token);
        }
    }
    return tokens;
}