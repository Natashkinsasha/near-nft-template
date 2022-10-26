import { assert, near, UnorderedSet } from 'near-sdk-js';

import { Contract, DELIMETER } from '.';
import { Sale } from './sale';
import { internalSupplyByOwnerId } from './sale_views';

/// where we add the sale because we know nft owner can only call nft_approve
export function internalNftOnApprove({
  contract,
  tokenId,
  ownerId,
  approvalId,
  msg,
}: {
  contract: Contract;
  tokenId: string;
  ownerId: string;
  approvalId: number;
  msg: string;
}) {
  // get the contract ID which is the predecessor
  const contractId = near.predecessorAccountId();
  //get the signer which is the person who initiated the transaction
  const signerId = near.signerAccountId();

  //make sure that the signer isn't the predecessor. This is so that we're sure
  //this was called via a cross-contract call
  assert(
    signerId != contractId,
    'this function can only be called via a cross-contract call',
  );
  //make sure the owner ID is the signer.
  assert(ownerId == signerId, 'only the owner of the token can approve it');

  //we need to enforce that the user has enough storage for 1 EXTRA sale.
  const storageAmount = contract.storage_minimum_balance();
  //get the total storage paid by the owner
  const ownerPaidStorage = contract.storageDeposits.get(signerId) || BigInt(0);
  //get the storage required which is simply the storage for the number of sales they have + 1
  const signerStorageRequired =
    (BigInt(internalSupplyByOwnerId({ contract, accountId: signerId })) +
      BigInt(1)) *
    BigInt(storageAmount);

  //make sure that the total paid is >= the required storage
  assert(
    ownerPaidStorage >= signerStorageRequired,
    `The owner does not have enough storage to approve this token. Need ${signerStorageRequired} yoctoNEAR`,
  );

  //if all these checks pass we can create the sale conditions object.
  const saleConditions = JSON.parse(msg);
  if (
    !saleConditions.hasOwnProperty('sale_conditions') ||
    Object.keys(saleConditions).length != 1
  ) {
    near.log('invalid sale conditions');
    throw new Error('invalid sale conditions');
  }
  //create the unique sale ID which is the contract + DELIMITER + token ID
  const contractAndTokenId = `${contractId}${DELIMETER}${tokenId}`;

  const sale: Sale = {
    owner_id: ownerId, //owner of the sale / token
    approval_id: approvalId, //approval ID for that token that was given to the market
    nft_contract_id: contractId, //NFT contract the token was minted on
    token_id: tokenId, //the actual token ID
    sale_conditions: saleConditions.sale_conditions, //the sale conditions
  };

  //insert the key value pair into the sales map. Key is the unique ID. value is the sale object
  contract.sales.set(contractAndTokenId, sale);

  //Extra functionality that populates collections necessary for the view calls
  //get the sales by owner ID for the given owner. If there are none, we create a new empty set
  const byOwnerId =
    (contract.byOwnerId.get(ownerId) as UnorderedSet) ||
    new UnorderedSet(ownerId);
  //insert the unique sale ID into the set
  byOwnerId.set(contractAndTokenId);
  //insert that set back into the collection for the owner
  contract.byOwnerId.set(ownerId, byOwnerId);

  //get the token IDs for the given nft contract ID. If there are none, we create a new empty set
  const byNftContractId =
    (contract.byNftContractId.get(contractId) as UnorderedSet) ??
    new UnorderedSet(contractId);
  //insert the token ID into the set
  byNftContractId.set(tokenId);
  //insert the set back into the collection for the given nft contract ID
  contract.byNftContractId.set(contractId, byNftContractId);
}
