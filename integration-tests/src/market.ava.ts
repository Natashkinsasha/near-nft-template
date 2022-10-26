import {Worker, NEAR, NearAccount} from 'near-workspaces';
import anyTest, { TestFn } from 'ava';
import {Sale} from '../../contract/src/market/sale';

const test = anyTest as TestFn<{
    worker: Worker;
    accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
    // Init the worker and start a Sandbox server
    const worker = await Worker.init();

    // deploy contract
    const root = worker.rootAccount;

    const nftContract = await root.createSubAccount("nft-contract", {
        initialBalance: NEAR.parse("30 N").toJSON(),
    });

    const marketContract = await root.createSubAccount("market-contract", {
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

    await nftContract.deploy(process.argv[2]);

    await nftContract.call(nftContract, 'init', {});

    await marketContract.deploy(process.argv[3]);


    // Save state for test runs, it is unique for each test
    t.context.worker = worker;
    t.context.accounts = { root, nftContract, marketContract, alice, bob, tim };
});

test.afterEach(async (t) => {
    // Stop Sandbox server
    await t.context.worker.tearDown().catch((error) => {
        console.log("Failed to stop the Sandbox:", error);
    });
});

test("should transfer nft to market", async (t) => {
    const { nftContract, marketContract, alice } = t.context.accounts;
    const count = 10;
    const sale_conditions = 1;
    const token_id = "1";
    await nftContract.call(nftContract, 'airdrop', {count, receiver_id: alice.accountId}, {attachedDeposit: NEAR.parse('1 NEAR')});
    await alice.call(marketContract, 'storage_deposit', {}, {attachedDeposit: NEAR.parse('1 NEAR') });
    await alice.call(nftContract, 'nft_approve', {
            account_id: marketContract.accountId,
            token_id,
            msg: JSON.stringify({sale_conditions})
        },
        {attachedDeposit: NEAR.parse('1 yoctoNEAR'), gas: '300000000000000'}
    );
    const nftToken = await alice.call(nftContract, 'nft_token', {token_id: token_id});
    t.deepEqual(nftToken, {  token_id: '1',
        owner_id: 'alice.test.near',
        metadata: {},
        approved_account_ids: { 'market-contract.test.near': 1 },
        royalty: {}
    });
    const sales: Sale[] = await marketContract.view('get_sales_by_owner_id', {account_id: alice.accountId});
    t.deepEqual(sales, [
            {
                owner_id: alice.accountId,
                approval_id: 1,
                nft_contract_id: nftContract.accountId,
                token_id,
                sale_conditions
            }
        ]
    );
});


test("should offer", async (t) => {
    const { nftContract, marketContract, alice, bob } = t.context.accounts;
    const count = 10;
    const sale_conditions = 1;
    const token_id = "1";
    await nftContract.call(nftContract, 'airdrop', {count, receiver_id: alice.accountId}, {attachedDeposit: NEAR.parse('1 NEAR')});
    await alice.call(marketContract, 'storage_deposit', {}, {attachedDeposit: NEAR.parse('1 NEAR') });
    await alice.call(nftContract, 'nft_approve', {
            account_id: marketContract.accountId,
            token_id,
            msg: JSON.stringify({sale_conditions})
        },
        {attachedDeposit: NEAR.parse('1 yoctoNEAR'), gas: '300000000000000'}
    );
    let sales: Sale[] = await marketContract.view('get_sales_by_owner_id', {account_id: alice.accountId});
    t.is(sales.length, 1);
    await bob.call(marketContract, 'offer', {
        nft_contract_id: nftContract.accountId, token_id},
        {
            attachedDeposit: NEAR.parse('1 NEAR'),
            gas: '300000000000000'
        }
    );
    sales = await marketContract.view('get_sales_by_owner_id', {account_id: alice.accountId});
    t.is(sales.length, 0);
    const nftToken = await bob.call(nftContract, 'nft_token', {token_id});
    t.deepEqual(nftToken, {
        token_id,
        owner_id: 'bob.test.near',
        metadata: {},
        approved_account_ids: {},
        royalty: {}
    });
});