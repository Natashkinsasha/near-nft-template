import { assert, near } from 'near-sdk-js';

import { current, increment } from '../lib/Counter';
import { NftMintEventLogData } from '../nep/NEP-171';
import { emit } from '../util';
import {
  Contract,
  NFT_METADATA_SPEC,
  NFT_STANDARD_NAME,
  TokenInfo,
} from './index';
import { internalAddTokenToOwner, refundDeposit } from './internal';

export function internalMint({
  contract,
  receiverId,
  count = 1,
}: {
  count?: number;
  contract: Contract;
  receiverId: string;
}): void {
  //measure the initial storage being used on the contract TODO
  const initialStorageUsage = near.storageUsage();
  for (let i = 0; i < count; i++) {
    increment(contract);
    const tokenId = current(contract).toString();
    // create a royalty map to store in the token
    const royalty: { [accountId: string]: number } = {};
    const perpetualRoyalties: { [key: string]: number } = {};
    // if perpetual royalties were passed into the function: TODO: add isUndefined fn
    if (!!perpetualRoyalties) {
      //make sure that the length of the perpetual royalties is below 7 since we won't have enough GAS to pay out that many people
      assert(
        Object.keys(perpetualRoyalties).length < 7,
        'Cannot add more than 6 perpetual royalty amounts',
      );

      //iterate through the perpetual royalties and insert the account and amount in the royalty map
      Object.entries(perpetualRoyalties).forEach(([account, amount]) => {
        royalty[account] = amount;
      });
    }

    //specify the token struct that contains the owner ID
    const token: TokenInfo = {
      //set the owner ID equal to the receiver ID passed into the function
      owner_id: receiverId,
      //we set the approved account IDs to the default value (an empty map)
      approved_account_ids: {},
      //the next approval ID is set to 1
      next_approval_id: 1,
      //the map of perpetual royalties for the token (The owner will get 100% - total perpetual royalties)
      royalty,
    };

    //insert the token ID and token struct and make sure that the token doesn't exist
    assert(!contract.tokensById.containsKey(tokenId), 'Token already exists');
    contract.tokensById.set(tokenId, token);

    //insert the token ID and metadata
    contract.tokenMetadataById.set(tokenId, {});

    //call the internal method for adding the token to the owner
    internalAddTokenToOwner(contract, token.owner_id, tokenId);

    // Construct the mint log as per the events standard.
    const nftMintLog: NftMintEventLogData = {
      // Standard name ("nep171").
      standard: NFT_STANDARD_NAME,
      // Version of the standard ("nft-1.0.0").
      version: NFT_METADATA_SPEC,
      // The data related with the event stored in a vector.
      event: 'nft_mint',
      data: [
        {
          // Owner of the token.
          owner_id: token.owner_id,
          // Vector of token IDs that were minted.
          token_ids: [tokenId],
        },
      ],
    };

    // Log the json.
    emit(nftMintLog);
  }
  //calculate the required storage which was the used - initial TODO
  const requiredStorageInBytes =
    near.storageUsage().valueOf() - initialStorageUsage.valueOf();

  //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
  refundDeposit(requiredStorageInBytes);
}
