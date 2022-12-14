export type NFTContractMetadata = {
  spec: string; // required, essentially a version like "nft-1.0.0"
  name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string; // required, ex. "MOCHI"
  icon?: string; // Data URL
  base_uri?: string; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference?: string; // URL to a JSON file with more info
  reference_hash?: string; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

export type TokenMetadata = {
  title?: string; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description?: string; // free-form description
  media?: string; // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash?: string; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies?: number; // number of copies of this set of metadata in existence when token was minted.
  issued_at?: number; // When token was issued or minted, Unix epoch in milliseconds
  expires_at?: number; // When token expires, Unix epoch in milliseconds
  starts_at?: number; // When token starts being valid, Unix epoch in milliseconds
  updated_at?: number; // When token was last updated, Unix epoch in milliseconds
  extra?: string; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference?: string; // URL to an off-chain JSON file with more info.
  reference_hash?: string; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

export interface NEP177 {
  nft_metadata(): NFTContractMetadata;
}
