const { ethers } = require("hardhat");
const {DeployStep} = require("../deployUtils/DeployStep");
const RSConfig = require("../RSConfigBuilder");
const {mintRates} = require("./mintRates");
const {feeTokens, nativeWrappers} = require("./feeTokens");
const {USD_PRECISION} = require("../constants");
const DAY = 86400;
const TIMELOCK = 2 * DAY;
const BPS = 10_000;
const NET = 1;

const inUnits = (n,u) => ethers.utils.parseUnits(n.toString(), u);



const buildInitConfig = (ctx) => {
    const {timelock, approvers, wallets} = ctx;
   const rateRanges = mintRates.map(m => new RSConfig.MintRateRangeConfig(m));
   const tokens = [];
   const feeds = [];
   feeTokens[NET].forEach(f => {
    tokens.push(f.token);
    feeds.push(f.feed);
   });
   const feeTokenConfig = new RSConfig.FeeTokenConfig({
    feeTokens: tokens,
    priceFeeds: feeds
   });
   
   const multiSigConfig = new RSConfig.MultiSigConfig({
    requiredSigs: 2,
    timelockSeconds: timelock || TIMELOCK,
    logic: ctx.revshareVaultImpl.address,
    approvers: [
        approvers ? approvers[0].address : wallets.all[wallets.all.length-1].address,
        approvers ? approvers[1].address : wallets.all[wallets.all.length-2].address
    ]
   });

   return new RSConfig.RevshareConfig({
    wrappedNativeToken: nativeWrappers[NET],
    stdBpsRate: 8,
    minBpsRate: 4,
    baseMintThreshold: inUnits("100", USD_PRECISION),
    rateRanges,
    feeTokenConfig,
    multiSigConfig
   });
}

class DeployRevshareVaultProxy extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "RevshareVaultProxy"
        });
    }

    getDeployerWallet() {
        const ctx = this.sequence.context;
        const wallets = ctx.wallets.all;
        ctx.wallets.dexibleAdmin = ctx.dexibleAdmin || wallets[wallets.length-1];
        console.log("Dexible admin is", ctx.wallets.dexibleAdmin.address);
        return ctx.wallets.dexibleAdmin;
    }

    updateContext({deployed}) {
        const ctx = this.sequence.context;
        ctx.revshareVault = new ethers.Contract(deployed.address, ctx.revshareVaultImpl.interface || ctx.revshareVaultImpl.abi, ethers.provider);
    }

    getLibraries() {
        
        const ctx = this.sequence.context;
        if(!ctx.libMultiSig) {
            throw new Error("Missing LibMultiSig in sequence context");
        }
        
        return  {
            LibMultiSig: ctx.libMultiSig.address,
        }
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        
        const impl = new ctx.ethers.Contract(ctx.revshareVaultImpl.address, ctx.revshareVaultImpl.interface || ctx.revshareVaultImpl.abi, ctx.wallets.owner);
        const config = buildInitConfig(ctx);
        const fnDef = `initialize(${RSConfig.RevshareConfig.tupleDefinition})`;
        const init = impl.interface.encodeFunctionData(fnDef, [config]);
        return [impl.address, init];
    }

}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployRevshareVaultProxy({sequence}));
}

module.exports = {
    addStep
}