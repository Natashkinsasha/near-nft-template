#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/nft/index.ts build/nft.wasm
near-sdk-js build src/market/index.ts build/market.wasm