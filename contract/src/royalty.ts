import { assert, near } from "near-sdk-js";
import {Contract, TokenInfo} from ".";
import { assertOneYocto, internalTransfer, refundApprovedAccountIds, royaltyToPayout } from "./internal";
import {Payout} from "./nep/NEP-199";


export function internalNftPayout({
    contract,
    tokenId,
    balance,
    maxLenPayout
}:{
    contract: Contract, 
    tokenId: string,
    balance: bigint, 
    maxLenPayout: number,
}): Payout{
    //get the token object
    const token = contract.tokensById.get(tokenId) as TokenInfo | null;
    if (!token) {
        throw new Error("no token");
    }

    //get the owner of the token
    const ownerId = token.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpetual = 0;
    //keep track of the payout object to send back
    const payoutObj: { [key: string]: string } = {};
    //get the royalty object from token
    const royalty = token.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    Object.entries(royalty).forEach(([key, value], index) => {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royaltyToPayout(value, balance);
            totalPerpetual += value;
        }
    });

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royaltyToPayout(10000 - totalPerpetual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}

//transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
export function internalNftTransferPayout({
    contract,
    receiverId,
    tokenId,
    approvalId,
    memo,
    balance,
    maxLenPayout
}:{
    contract: Contract, 
    receiverId: string, 
    tokenId: string,
    approvalId?: number,
    memo: string,
    balance: bigint,
    maxLenPayout: number,
}): Payout {
    //assert that the user attached 1 yocto NEAR for security reasons
    assertOneYocto();
    //get the sender ID
    let senderId = near.predecessorAccountId();
    //transfer the token to the passed in receiver and get the previous token object back
    let previousToken: TokenInfo = internalTransfer(
        contract,
        senderId,
        receiverId,
        tokenId,
        approvalId,
        memo,
    );

    //refund the previous token owner for the storage used up by the previous approved account IDs
    refundApprovedAccountIds(
        previousToken.owner_id,
        previousToken.approved_account_ids,
    );

    //get the owner of the token
    const ownerId = previousToken.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpetual = 0;
    //keep track of the payout object to send back
    const payoutObj: { [key: string]: string } = {};
    //get the royalty object from token
    const royalty = previousToken.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    Object.entries(royalty).forEach(([key, value], index) => {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royaltyToPayout(value, balance);
            totalPerpetual += value;
        }
    });

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royaltyToPayout(10000 - totalPerpetual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}