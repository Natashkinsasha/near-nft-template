import { Worker, NEAR, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';
import {JsonToken} from '../../contract/src/index';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // deploy contract
  const root = worker.rootAccount;

  const contract = await root.createSubAccount("contract", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  const alice = await root.createSubAccount("alice", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  const bob = await root.createSubAccount("bob", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  const tim = await root.createSubAccount("tim", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });


  // Get wasm file path from package.json test script in folder above
  await contract.deploy(process.argv[2]);

  await contract.call(contract, 'init', {});

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract, alice, bob, tim };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("should return nft metadata", async (t) => {
  const { contract } = t.context.accounts;
  const nftMetadata = await contract.view('nft_metadata');
  t.deepEqual(nftMetadata, {
    spec: "nft-1.0.0",
    name: "NFT Tutorial Contract",
    symbol: "GOTEAM"
  });
});

test("should mint tokens", async (t) => {
  const { contract } = t.context.accounts;
  const count = 10;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  const nftTotalSupply = await contract.view('nft_total_supply');
  t.is(nftTotalSupply, count);
});

test("should return nft token", async (t) => {
  const { contract } = t.context.accounts;
  const count = 1;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  const nftToken = await contract.view('nft_token', {token_id: "1"});
  t.deepEqual(nftToken, {
    approved_account_ids: {},
    metadata: {},
    owner_id: contract.accountId,
    royalty: {},
    token_id: '1',
  });
});

test("should not return nft token", async (t) => {
  const { contract } = t.context.accounts;
  const nftToken = await contract.view('nft_token', {token_id: "1"});
  t.is(nftToken, null);
});

test("should return nft tokens", async (t) => {
  const { contract, alice } = t.context.accounts;
  const count = 10;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  await contract.call(contract, 'nft_transfer', {receiver_id: alice.accountId,  token_id: "4"}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')})
  let nftTokens: JsonToken[] = await contract.view('nft_tokens', { from_index: '3', limit: 3 });
  t.is(nftTokens.length, 3);
  nftTokens = await contract.view('nft_tokens', { account_id: contract.accountId, from_index: '7' });
  t.is(nftTokens.length, 3);
});

test("should return nft tokens for owner", async (t) => {
  const { contract, alice } = t.context.accounts;
  const count = 10;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  let nftTokens: JsonToken[] = await contract.view('nft_tokens_for_owner', { account_id: contract.accountId });
  t.is(nftTokens.length, 10);
  await contract.call(contract, 'nft_transfer', {receiver_id: alice.accountId,  token_id: "4"}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')})
  nftTokens = await contract.view('nft_tokens_for_owner', { account_id: contract.accountId });
  t.is(nftTokens.length, 9);
  nftTokens = await contract.view('nft_tokens_for_owner', { account_id: contract.accountId, from_index: '7' });
  t.is(nftTokens.length, 2);
});

test("should return supply nft tokens for owner", async (t) => {
  const { contract, alice } = t.context.accounts;
  const count = 10;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  let supply = await contract.view('nft_supply_for_owner', { account_id: contract.accountId });
  t.is(supply, 10);
  await contract.call(contract, 'nft_transfer', {receiver_id: alice.accountId,  token_id: "4"}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')})
  supply = await contract.view('nft_supply_for_owner', { account_id: contract.accountId });
  t.is(supply, 9);
});

test("should transfer nft token", async (t) => {
  const { contract, alice } = t.context.accounts;
  const count = 1;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  const isTransferred = await contract.call(contract, 'nft_transfer', {receiver_id: alice.accountId,  token_id: "1"}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  t.is(isTransferred, true);
});

test("should return confirmation approval", async (t) => {
  const { contract, alice, bob } = t.context.accounts;
  await contract.call(contract, 'airdrop', {receiver_id: alice.accountId}, {attachedDeposit: NEAR.parse('1 NEAR')});
  await alice.call(contract, 'nft_approve', {token_id: "1", account_id: bob.accountId}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  const isApproved = await bob.call(contract, 'nft_is_approved', {token_id: "1", approved_account_id: bob.accountId, approval_id: 0});
  t.is(isApproved, true);
});

test("should revoke approve", async (t) => {
  const { contract, alice, bob } = t.context.accounts;
  await contract.call(contract, 'airdrop', {receiver_id: alice.accountId}, {attachedDeposit: NEAR.parse('1 NEAR')});
  await alice.call(contract, 'nft_approve', {token_id: "1", account_id: bob.accountId}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  let nftToken = await contract.view('nft_token', {token_id: "1"});
  t.deepEqual(nftToken, {
    approved_account_ids: {
      [bob.accountId]: 1,
    },
    metadata: {},
    owner_id: alice.accountId,
    royalty: {},
    token_id: '1',
  });
  await alice.call(contract, 'nft_revoke', {token_id: "1", account_id: bob.accountId}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  nftToken = await contract.view('nft_token', {token_id: "1"});
  t.deepEqual(nftToken, {
    approved_account_ids: {},
    metadata: {},
    owner_id: alice.accountId,
    royalty: {},
    token_id: '1',
  });
});

test("should revoke all approves", async (t) => {
  const { contract, alice, bob, tim } = t.context.accounts;
  await contract.call(contract, 'airdrop', {receiver_id: alice.accountId}, {attachedDeposit: NEAR.parse('1 NEAR')});
  await alice.call(contract, 'nft_approve', {token_id: "1", account_id: bob.accountId}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  await alice.call(contract, 'nft_approve', {token_id: "1", account_id: tim.accountId}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  let nftToken = await contract.view('nft_token', {token_id: "1"});
  t.deepEqual(nftToken, {
    approved_account_ids: {
      [bob.accountId]: 1,
      [tim.accountId]: 2,
    },
    metadata: {},
    owner_id: alice.accountId,
    royalty: {},
    token_id: '1',
  });
  await alice.call(contract, 'nft_revoke_all', {token_id: "1"}, {attachedDeposit: NEAR.parse('1 yoctoNEAR')});
  nftToken = await contract.view('nft_token', {token_id: "1"});
  t.deepEqual(nftToken, {
    approved_account_ids: {},
    metadata: {},
    owner_id: alice.accountId,
    royalty: {},
    token_id: '1',
  });
});
