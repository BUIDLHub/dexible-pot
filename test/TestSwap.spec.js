const {deployAll} = require("../src/deployAll");
const {estimate} = require("./setup/zrx");
const {WETH_BY_NET, USDC_BY_NET, USDC} = require("./setup/commonAddresses");
const {setBalance: setUSDCBalance, asTokenContract: asUSDCContract} = require("./setup/USDC");
const {setBalance: setWETHBalance, asTokenContract: asWETHContract} = require("./setup/WETH");
const {SwapRequest, ExecutionRequest, RouteRequest, FeeDetails, RouterRequest, TokenAmount, } = require("../src/DexibleSwap");
const { ethers } = require("hardhat");

const NET = 1; //42161;

const bn = ethers.BigNumber.from;
const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

const GAS_PRICE = NET === 42161 ? inUnits(".1", 9) : inUnits("50", 9);
const FEE_TOKEN = USDC_BY_NET[NET];
const FT_DECS = 6;
const IN_AMT = "1000";
const FTokenContract = asUSDCContract(ethers.provider, NET);

describe("TestSwap", function (){
    this.timeout(60000);

    let props = {
        chainId: NET
    };
    let relay = null;
    let trader = null;
    before(async function() {

        const signers = await hre.ethers.getSigners();

        const relays = [signers[1].address];
        console.log("Using relays", relays);

        props = await deployAll({
            timelock: 1,
            forceDeploy: true,
            relays
        });
        const {wallets} = props;
        trader = wallets.all[0];
        relay = wallets.all[1];
    });

    const setupSpend = async (override) => {
        const {dexible} = props;
        await setUSDCBalance({
            ethers: ethers,
            provider: ethers.provider,
            chain: NET,
            tgtAddress: trader.address,
            balance: 1_000_000
        });
        const con = asUSDCContract(ethers.provider, NET);
        await con.connect(trader).approve(override || dexible.address, ethers.constants.MaxUint256);

        const wCon = asWETHContract(ethers.provider, NET);
        await wCon.connect(trader).approve(override || dexible.address, ethers.constants.MaxUint256);
        
    }

    const zrxSwap = async () => {
        
        const fullInput = inUnits(IN_AMT, 6)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(95).div(100).toString(),
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);
        await setupSpend(est.allowanceTarget);
        console.log("Spend setup complete");
        const txn = await trader.sendTransaction({
            to: est.to,
            data: est.data,
            gasLimit: 600_000,
            gasPrice: GAS_PRICE //inUnits(NET===42161 ? ".1":"25", 9)
        });
        const r = await txn.wait();
        console.log("Zrx gas", r.gasUsed.toString());
    }

    const doRelaySwap = async (details) => {

        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }

        const {dexible} = props;
        await setupSpend();

        const fullInput = inUnits(IN_AMT, 6)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(95).div(100).toString(),
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);

        const minBuy = bn(est.buyAmount).mul(995).div(10000);
        
        const feeDetails = new FeeDetails({
            feeToken: FEE_TOKEN,
            affiliate: ethers.constants.AddressZero,
            affiliatePortion: bn(0)
        });
        const er = new ExecutionRequest({
            requester: trader.address,
            fee: feeDetails
        });

        const rr = new RouterRequest({
            router: est.to,
            spender: est.allowanceTarget,
            routeAmount: new TokenAmount({
                token: USDC_BY_NET[NET],
                amount: swapDetails.sellAmount
            }),
            routerData: est.data
        });
        const sr = new SwapRequest({
            executionRequest: er,
            tokenIn: new TokenAmount({
                token: USDC_BY_NET[NET],
                amount: fullInput
            }),
            tokenOut: new TokenAmount({
                token: WETH_BY_NET[NET],
                amount: minBuy
            }),
            routes: [rr]
        });
        const estGas = await dexible.connect(relay).estimateGas.swap(sr, {
            gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
        });
        console.log("Relay gas estimate", estGas.toString());

        const txn = await dexible.connect(relay).swap(sr, {
            gasLimit: 2_000_000, //estGas,
            gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
        });
        const r = await txn.wait();
        return r;
    }

    const doRelayWethSwap = async (details) => {

        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }

        const {dexible} = props;
        await setupSpend();
        await setWETHBalance({
            ethers: ethers,
            provider: ethers.provider,
            chain: NET,
            tgtAddress: trader.address,
            balance: 10
        });

        const fullInput = inUnits("1", 18)
        const swapDetails = {
            chainId: NET,
            sellToken: WETH_BY_NET[NET],
            buyToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(95).div(100).toString(),
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);

        const minBuy = bn(est.buyAmount).mul(995).div(10000);
        
        const feeDetails = new FeeDetails({
            feeToken: WETH_BY_NET[NET],
            affiliate: ethers.constants.AddressZero,
            affiliatePortion: bn(0)
        });
        const er = new ExecutionRequest({
            requester: trader.address,
            fee: feeDetails
        });

        const rr = new RouterRequest({
            router: est.to,
            spender: est.allowanceTarget,
            routeAmount: new TokenAmount({
                token: WETH_BY_NET[NET],
                amount: swapDetails.sellAmount
            }),
            routerData: est.data
        });
        const sr = new SwapRequest({
            executionRequest: er,
            tokenIn: new TokenAmount({
                token: WETH_BY_NET[NET],
                amount: fullInput
            }),
            tokenOut: new TokenAmount({
                token: USDC_BY_NET[NET],
                amount: minBuy
            }),
            routes: [rr]
        });
        const estGas = await dexible.connect(relay).estimateGas.swap(sr, {
            gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
        });
        console.log("Relay gas estimate", estGas.toString());

        const txn = await dexible.connect(relay).swap(sr, {
            gasLimit: 2_000_000, //estGas,
            gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
        });
        const r = await txn.wait();
        return r;
    }

    const doSelfSwap = async (details) => {

        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }

        const {dexible} = props;
        await setupSpend();

        const fullInput = inUnits(IN_AMT, 6)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(98).div(100).toString(),
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);

        const minBuy = bn(est.buyAmount).mul(995).div(10000);
        const rr = new RouterRequest({
            router: est.to,
            spender: est.allowanceTarget,
            routeAmount: new TokenAmount({
                token: USDC_BY_NET[NET],
                amount: swapDetails.sellAmount
            }),
            routerData: est.data
        });
        //self-swap removes execution request part of swap since it only pertains to
        //relay requests that have potential affiliate discounts to apply, etc.
        const sr = {
            feeToken: FEE_TOKEN,
            tokenIn: new TokenAmount({
                token: USDC_BY_NET[NET],
                amount: fullInput
            }),
            tokenOut: new TokenAmount({
                token: WETH_BY_NET[NET],
                amount: minBuy
            }),
            routes: [rr]
        };
        const txn = await dexible.connect(trader).selfSwap(sr, {
            gasPrice: GAS_PRICE //inUnits("25", 9)
        });
        const r = await txn.wait();
        return r;
    }

    it("Should perform zrx swap", async () => {
        await zrxSwap();
    });

    it("Should perform direct swap", async () => {
        const r = await doSelfSwap({ });
        console.log("Self-Swap gas used", r.gasUsed);
    })

    it("Should perform relay swap", async () => {
        const r = await doRelaySwap({ });
        console.log("Relayed gas used", r.gasUsed);
        let bal = await props.dxblToken.balanceOf(trader.address);
        console.log("Post-Swap DXBL Balance", inDecs(bal, 18));

        const nav = await props.communityVault.currentNavUSD();
        console.log("Pre-Burn NAV", nav);

        const estOut = await props.communityVault.estimateRedemption(FEE_TOKEN, bal);
        console.log("Estimated output", estOut.toString());

        console.log("Pre-Burn Assets", await props.communityVault.assets());
        console.log("Pre-Burn Treasury", await FTokenContract.balanceOf(props.wallets.admin.address));
        
        const before = await FTokenContract.balanceOf(trader.address);
        console.log("Pre-burn Fee-token balance", inDecs(before, FT_DECS));

        await props.communityVault.connect(trader).redeemDXBL(FEE_TOKEN, bal, bn(estOut).mul(999).div(10000), true);
        const after = await FTokenContract.balanceOf(trader.address);
        console.log("Post-burn Fee-token balance", inDecs(after, FT_DECS));
        bal = await props.dxblToken.balanceOf(trader.address);
        console.log("post-burn DXBL balance", bal.toString());
        console.log("Assets", await props.communityVault.assets());
        console.log("Post-Burn NAV", await props.communityVault.currentNavUSD());
    });

    it("Should perform WETH swap and redeem in native token", async () => {
        const r = await doRelayWethSwap({ });
        console.log("Relayed WETH gas used", r.gasUsed);
        let bal = await props.dxblToken.balanceOf(trader.address);
        console.log("Post-Swap DXBL Balance", inDecs(bal, 18));
        const estOut = await props.communityVault.estimateRedemption(WETH_BY_NET[NET], bal);
        console.log("Estimated ETH output", estOut.toString());

        const b4 = await ethers.provider.getBalance(trader.address);
        console.log("ETH before", inDecs(b4, 18));
        await props.communityVault.connect(trader).redeemDXBL(WETH_BY_NET[NET], bal, bn(estOut).mul(999).div(10000), true);
        const after = await ethers.provider.getBalance(trader.address);
        console.log("ETH after", inDecs(after, 18));

    })

    

});