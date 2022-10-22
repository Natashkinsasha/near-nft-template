import { Worker, NEAR, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';

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


  // Get wasm file path from package.json test script in folder above
  console.log(process.argv);
  await contract.deploy(process.argv[2]);

  // await contract.call(contract, 'init', {});

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract };
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
  const count = 1;
  await contract.call(contract, 'airdrop', {count}, {attachedDeposit: NEAR.parse('1 NEAR')});
  const nftTotalSupply = await contract.view('nft_total_supply');
  t.is(nftTotalSupply, count);
});


