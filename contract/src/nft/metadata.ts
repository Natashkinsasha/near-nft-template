import { NFTContractMetadata } from '../nep/NEP-177';
import { Contract } from './index';

export function internalNftMetadata({
  contract,
}: {
  contract: Contract;
}): NFTContractMetadata {
  return contract.metadata;
}
