const {deployAll} = require("../../src/deployAll");
const {estimate} = require("../setup/zrx");
const {WETH_BY_NET, UNI_BY_NET} = require("../setup/commonAddresses");
const {asTokenContract: asUNIContract} = require("../setup/UNI");
const {setBalance: setWETHBalance, asTokenContract: asWETHContract} = require("../setup/WETH");
const {SwapRequest, ExecutionRequest, RouteRequest, FeeDetails, RouterRequest, TokenAmount, } = require("../../src/DexibleSwap");
const { ethers } = require("hardhat");

const NET = 5;

let timestamp = Math.floor(Date.now()/1000);

const bn = ethers.BigNumber.from;
const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

const GAS_PRICE = NET === 42161 ? inUnits(".1", 9) : inUnits("25", 9);
const FEE_TOKEN = WETH_BY_NET[NET];
const FT_DECS = 18;
const IN_AMT = ".2";
const IN_DECS = 18;
const FTokenContract = asWETHContract(ethers.provider, NET);
console.log("FEE TOKEN CONTRACT", FTokenContract.address);

const {deployedContracts} = require("./DeployedContracts");

describe("TestSwap", function (){
    this.timeout(6000000);

    let props = {
        chainId: NET
    };
    let relay = null;
    let trader = null;
    let affiliate = null;
    let liveProvider = null;
    before(async function() {

        props = await deployAll({
            timelock: 1,
            forceDeploy: true,
        });
        const url = hre.userConfig.networks.goerli.url;
        if(!url) {
            throw new Error("Could not find url in provider network");
        }
        liveProvider = new ethers.providers.JsonRpcProvider(url);
        const {dexible, communityVault, dxblToken} = props;
        props.dexible = new ethers.Contract(deployedContracts.Dexible[NET], dexible.interface, liveProvider);
        props.communityVault = new ethers.Contract(deployedContracts.CommunityVault[NET], communityVault.interface, liveProvider);
        props.dxblToken = new ethers.Contract(deployedContracts.DXBL[NET], dxblToken.interface, liveProvider);
        trader = new ethers.Wallet(`0x${process.env.MAINNET_OWNER}`, liveProvider);
        relay = new ethers.Wallet(process.env.GOERLI_RELAY, liveProvider);
        console.log("TRADER", trader.address);
        console.log("RELAY", relay.address);
    });

    const setupSpend = async (override) => {
        const {dexible} = props;
        
        const con = asUNIContract(ethers.provider, NET);
        await con.connect(trader).approve(override || dexible.address, ethers.constants.MaxUint256);

        const wCon = asWETHContract(ethers.provider, NET);
        await wCon.connect(trader).approve(override || dexible.address, ethers.constants.MaxUint256);
        
    }

    const doRelaySwap = async (details) => {

        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }

        const {dexible} = props;
        //await setupSpend();

        const fullInput = inUnits(IN_AMT, IN_DECS);
        const swapDetails = {
            chainId: NET,
            buyToken: WETH_BY_NET[NET],
            sellToken: UNI_BY_NET[NET],
            sellAmount: fullInput,
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
                token: UNI_BY_NET[NET],
                amount: swapDetails.sellAmount
            }),
            routerData: est.data
        });
        const sr = new SwapRequest({
            executionRequest: er,
            tokenIn: new TokenAmount({
                token: UNI_BY_NET[NET],
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

    it("Should perform relay swap", async () => {
        let r = await doRelaySwap({ });
        console.log("Relayed gas used", r.gasUsed);
        let bal = await props.dxblToken.balanceOf(trader.address);
        console.log("Post-Swap DXBL Balance", inDecs(bal, 18));

        const nav = await props.communityVault.currentNavUSD();
        console.log("Pre-Burn NAV", nav);

        const estOut = await props.communityVault.estimateRedemption(FEE_TOKEN, bal);
        console.log("Estimated output", estOut.toString());

        console.log("Pre-Burn Assets", await props.communityVault.assets());
        //console.log("Pre-Burn Treasury", await FTokenContract.balanceOf(props.wallets.admin.address));
        
        const before = await liveProvider.getBalance(trader.address);
        console.log("Pre-burn ETH balance", inDecs(before, FT_DECS));

        console.log("Burning DXBL", inDecs(bal, 18));
        const txn = await props.communityVault.connect(trader).redeemDXBL(FEE_TOKEN, bal, bn(estOut).mul(999).div(10000), true, {
            gasPrice: GAS_PRICE
        });
        r = await txn.wait();
        console.log("Gas used for redeem", r.gasUsed);

        const after = await liveProvider.getBalance(trader.address);
        console.log("Post-burn ETH balance", inDecs(after, FT_DECS));
        bal = await props.dxblToken.balanceOf(trader.address);
        console.log("post-burn DXBL balance", bal.toString());
        console.log("Assets", await props.communityVault.assets());
        console.log("Post-Burn NAV", await props.communityVault.currentNavUSD());
    });


});