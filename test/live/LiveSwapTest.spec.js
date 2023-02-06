const { ethers } = require("hardhat");
const {deployAll} = require("../../src/deployAll");
const {USDC_BY_NET, WETH_BY_NET} = require("../setup/commonAddresses");
const {asTokenContract: asUSDCContract} = require("../setup/USDC");
const {estimate} = require("../setup/zrx");
const hre = require("hardhat");
const {deployedContracts} = require("./DeployedContracts");

const {
    SwapRequest, 
    ExecutionRequest, 
    RouteRequest, 
    FeeDetails, 
    RouterRequest, 
    TokenAmount, 
} = require("../../src/DexibleSwap");

require("dotenv").config();

const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;
const bn = ethers.BigNumber.from;


const NET = 42161;
const FEE_TOKEN = USDC_BY_NET[NET];
const IN_DECS = 6;
const FT_DECS = 6;
const IN_AMT = "10";

describe("LiveSwapTest", function() {

    this.timeout(60000);

    let props = {
        chainId: NET
    };
    let trader = null;
    let relay = null;
    before(async function() {
        props = await deployAll({
            timelock: 1,
            forceDeploy: true
        });
        const url = hre.userConfig.networks.arbitrum.url;
        if(!url) {
            throw new Error("Could not find url in provider network");
        }
        const liveProvider = new ethers.providers.JsonRpcProvider(url);

        const {dexible, revshareVault, dxblToken} = props;
        props.dexible = new ethers.Contract(deployedContracts.Dexible[NET], dexible.interface, liveProvider);
        props.revshareVault = new ethers.Contract(deployedContracts.RevshareVault[NET], revshareVault.interface, liveProvider);
        props.dxblToken = new ethers.Contract(deployedContracts.DXBL[NET], dxblToken.interface, liveProvider);
        trader = new ethers.Wallet(`0x${process.env.MAINNET_OWNER}`, liveProvider);
        if(NET === 42161) {
            relay = new ethers.Wallet(process.env.ARB_RELAY, liveProvider);
        }
    });
    
    
    const setupSpend = async (override) => {
        const {dexible} = props;
        const con = asUSDCContract(ethers.provider, NET);
        return await con.connect(trader).approve(override || dexible.address, ethers.constants.MaxUint256);
    }

    /*
    it("Should deploy and use live contracts", async () => {
        const {dexible} = props;

        let txn = await setupSpend();
        let r = await txn.wait();
        console.log("Spend approved", r);

        const fullInput = inUnits(IN_AMT, IN_DECS)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(97).div(100).toString(),
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
        txn = await dexible.connect(trader).selfSwap(sr, {
            gasPrice: inUnits("1", 9)
        });
        r = await txn.wait();
        console.log("Finished swap", r);
    });
    */
    /*
    it("Should swap using relay", async () => {
        const {dexible} = props;

        let txn = await setupSpend();
        let r = await txn.wait();
        console.log("Spend approved", r);

        const fullInput = inUnits(IN_AMT, IN_DECS)
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: USDC_BY_NET[NET],
            sellAmount: fullInput.mul(97).div(100).toString(),
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
        const er = new ExecutionRequest({
            requester: trader.address,
            fee: {
                feeToken: FEE_TOKEN,
                affiliate: ethers.constants.AddressZero,
                affiliatePortion: bn(0)
            }
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
        txn = await dexible.connect(relay).swap(sr, {
            //gasLimit: 2_000_000, //estGas,
            gasPrice: inUnits(NET===42161?".1":"25", 9)
        });
        r = await txn.wait();
        console.log("Swapped", r);
    });
    */

    it("Should burn tokens", async () => {
        const {revshareVault, dxblToken} = props;
        const bal = await dxblToken.balanceOf(trader.address);
        const est = await revshareVault.estimateRedemption(FEE_TOKEN, bal);
        const txn = await revshareVault.connect(trader).redeemDXBL(FEE_TOKEN, bal, est.mul(995).div(10000));
        const r = await txn.wait();
        console.log("Burned", r);
    })
});

