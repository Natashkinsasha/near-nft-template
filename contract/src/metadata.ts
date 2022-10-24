import { Contract } from ".";
import {NFTContractMetadata} from "./nep/NEP-177";




export function internalNftMetadata({
    contract
}:{
    contract: Contract
}): NFTContractMetadata {
    return contract.metadata;
}