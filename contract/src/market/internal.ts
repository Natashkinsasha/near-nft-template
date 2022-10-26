import { assert, near, UnorderedSet } from 'near-sdk-js';

import { Contract, DELIMETER } from '.';
import { Sale } from './sale';

export function restoreOwners(
  collection?: UnorderedSet | null,
): UnorderedSet | null {
  if (!collection) {
    return null;
  }
  return UnorderedSet.deserialize(collection);
}

//used to make sure the user attached exactly 1 yoctoNEAR
export function assertOneYocto() {
  assert(
    near.attachedDeposit().toString() === '1',
    'Requires attached deposit of exactly 1 yoctoNEAR',
  );
}

//internal method for removing a sale from the market. This returns the previously removed sale object
export function internallyRemoveSale(
  contract: Contract,
  nftContractId: string,
  tokenId: string,
): Sale {
  //get the unique sale ID (contract + DELIMITER + token ID)
  const contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;
  //get the sale object by removing the unique sale ID. If there was no sale, panic
  const sale = contract.sales.remove(contractAndTokenId) as Sale;
  if (sale == null) {
    throw new Error('no sale');
  }

  //get the set of sales for the sale's owner. If there's no sale, panic.
  const byOwnerId = restoreOwners(
    contract.byOwnerId.get(sale.owner_id) as UnorderedSet,
  );
  if (byOwnerId == null) {
    throw new Error('no sales by owner');
  }
  //remove the unique sale ID from the set of sales
  byOwnerId.remove(contractAndTokenId);

  //if the set of sales is now empty after removing the unique sale ID, we simply remove that owner from the map
  if (byOwnerId.isEmpty()) {
    contract.byOwnerId.remove(sale.owner_id);
    //if the set of sales is not empty after removing, we insert the set back into the map for the owner
  } else {
    contract.byOwnerId.set(sale.owner_id, byOwnerId);
  }

  //get the set of token IDs for sale for the nft contract ID. If there's no sale, panic.
  const byNftContractId = restoreOwners(
    contract.byNftContractId.get(nftContractId) as UnorderedSet,
  );
  if (byNftContractId == null) {
    throw new Error('no sales by nft contract');
  }

  //remove the token ID from the set
  byNftContractId.remove(tokenId);
  //if the set is now empty after removing the token ID, we remove that nft contract ID from the map
  if (byNftContractId.isEmpty()) {
    contract.byNftContractId.remove(nftContractId);
    //if the set is not empty after removing, we insert the set back into the map for the nft contract ID
  } else {
    contract.byNftContractId.set(nftContractId, byNftContractId);
  }

  //return the sale object
  return sale;
}
