const {deployAll} = require("../src/deployAll");
const {estimate} = require("./setup/zrx");
const {WETH_BY_NET, USDC_BY_NET, USDC} = require("./setup/commonAddresses");
const {setBalance: setUSDCBalance, asTokenContract: asUSDCContract} = require("./setup/USDC");
const {setBalance: setWETHBalance, asTokenContract: asWETHContract} = require("./setup/WETH");
const {SwapRequest, ExecutionRequest, RouteRequest, FeeDetails, RouterRequest, TokenAmount, } = require("../src/DexibleSwap");
const { ethers } = require("hardhat");

const NET = 1; //42161;

let timestamp = Math.floor(Date.now()/1000);

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
    let affiliate = null;
    before(async function() {

        const signers = await hre.ethers.getSigners();

        const relays = [signers[1].address];
        console.log("Using relays", relays);

        const accts = hre.network.config.accounts;
        const m = accts.mnemonic;
        const p = `${accts.path}/${signers.length-1}`;
        const mSig = signers[signers.length-1];
        const w = ethers.Wallet.fromMnemonic(m, p);
        mSig.privateKey = w.privateKey.substring(2);

        props = await deployAll({
            timelock: 1,
            isTest: true,
            forceDeploy: true,
            relays,
            adminMultiSig: mSig
        });
        const {wallets} = props;
        trader = wallets.all[0];
        relay = wallets.all[1];
        affiliate = wallets.all[2];
    });

    const advanceTime = async (time) => {
        await ethers.provider.send("evm_mine", [time]);
    }

    const proposeVaultMigration = async () => {
        const {communityVault, adminMultiSig, mockMigration} = props;
        await communityVault.connect(adminMultiSig).scheduleMigration(mockMigration.address);
       
        while(true) {
            await advanceTime(timestamp + 5);
            timestamp += 5;
            try {
                const go = await communityVault.canMigrate();
                if(go) {
                    break;
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

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
        const {insufficientInBuffer, fail} = details;

        const fullInput = inUnits(IN_AMT, 6)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: insufficientInBuffer ? fullInput : fullInput.mul(95).div(100).toString(),
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);

        const minBuy = bn(est.buyAmount).mul(995).div(10000);
        
        const feeDetails = new FeeDetails({
            feeToken: FEE_TOKEN,
            affiliate: details.affiliate || ethers.constants.AddressZero,
            affiliatePortion: details.affiliatePortion || bn(0)
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
        if(!fail) {
            const estGas = await dexible.connect(relay).estimateGas.swap(sr, {
                gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
            });
            console.log("Relay gas estimate", estGas.toString());
        } else  {
            try {
                const estGas = await dexible.connect(relay).estimateGas.swap(sr, {
                    gasPrice: GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
                });
            } catch (e) {
                console.log(e.message);
                return;
            }
        }
        

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

        const {insufficientOutBuffer, fail} = details;

        const {dexible} = props;
        await setupSpend();
        await setWETHBalance({
            ethers: ethers,
            provider: ethers.provider,
            chain: NET,
            tgtAddress: trader.address,
            balance: 10
        });

        const inToken = USDC_BY_NET[NET];
        const outToken = WETH_BY_NET[NET];
        const fullInput = inUnits("1000", 6)

        const swapDetails = {
            chainId: NET,
            sellToken: inToken,
            buyToken: outToken,
            sellAmount: insufficientOutBuffer ? fullInput.mul(8).div(100) : fullInput,
            slippagePercentage: .005
        }
        
        const est = await estimate(swapDetails);

        const minBuy = bn(est.buyAmount).mul(10).div(10000);
        
        const feeDetails = new FeeDetails({
            feeToken: outToken,
            affiliate: ethers.constants.AddressZero,
            affiliatePortion:  bn(0)
        });
        const er = new ExecutionRequest({
            requester: trader.address,
            fee: feeDetails
        });

        const rr = new RouterRequest({
            router: est.to,
            spender: est.allowanceTarget,
            routeAmount: new TokenAmount({
                token:inToken,
                amount: swapDetails.sellAmount
            }),
            routerData: est.data
        });
        const sr = new SwapRequest({
            executionRequest: er,
            tokenIn: new TokenAmount({
                token: inToken,
                amount: fullInput
            }),
            tokenOut: new TokenAmount({
                token: outToken,
                amount: minBuy
            }),
            routes: [rr]
        });
        try {
            const estGas = await dexible.connect(relay).estimateGas.swap(sr, {
                gasPrice: insufficientOutBuffer ? GAS_PRICE.mul(4) : GAS_PRICE //inUnits(NET===42161?".1":"25", 9)
            });
            console.log("Relay gas estimate", estGas.toString());
        } catch (e) {
            if(fail) {
                console.log(e.message);
                return;
            }
            throw e;
        }
        

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

    it("Should fail to swap when insufficient buffer for fees", async () => {
        const r = await doRelaySwap({ 
            insufficientInBuffer: true,
            fail: true
        });
    });
    

    it("Should fail to swap when insufficient output generated", async () => {
        const r = await doRelayWethSwap({
            fail: true,
            insufficientOutBuffer: true
        });
    })

    
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

    });

    it("Should perform swap after migration", async () => {
        const affPart = ((IN_AMT*.0004)*.2).toFixed(FT_DECS);
        let r = await doRelaySwap({ affiliate: affiliate.address, affiliatePortion: inUnits(affPart, FT_DECS)});
        console.log("Pre-Migrate gas", r.gasUsed);
        
        const aBal = await FTokenContract.balanceOf(affiliate.address);
        if(aBal.eq(0)) {
            throw new Error("Expected affiliate to be paid");
        }
        console.log("Affiliate reward", inDecs(aBal, FT_DECS));
        const {communityVault, mockMigration} = props;
        const current = await Promise.all([
            communityVault.currentNavUSD(),
            communityVault.currentMintRateUSD(),
            communityVault.aumUSD(),
            communityVault.dailyVolumeUSD()
        ]);
        console.group("Before migration");
            console.log("NAV", current[0]);
            console.log("MintRate", current[1]);
            console.log("AUM", current[2]);
            console.log("24H Vol", current[3]);
        console.groupEnd();

        await proposeVaultMigration();
        //now swap which will execute migration
        r = await doRelaySwap({});
        const after = await Promise.all([
            mockMigration.currentNavUSD(),
            mockMigration.currentMintRateUSD(),
            mockMigration.aumUSD(),
            mockMigration.dailyVolumeUSD()
        ]);

        console.group("After migration");
            console.log("NAV", after[0]);
            console.log("MintRate", after[1]);
            console.log("AUM", after[2]);
            console.log("24H Vol", after[3])
        console.groupEnd();
        console.log("Gas used", r.gasUsed.toString());
    });
    

});