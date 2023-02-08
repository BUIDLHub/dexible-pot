const { ethers } = require("hardhat");
const {DeployStep} = require("../deployUtils/DeployStep");
const RSConfig = require("../VaultConfigBuilder");
const {mintRates} = require("./mintRates");
const {feeTokens, nativeWrappers} = require("./feeTokens");
const {USD_PRECISION} = require("../constants");
const DAY = 86400;
const TIMELOCK = 7 * DAY;
const BPS = 10_000;

const inUnits = (n,u) => ethers.utils.parseUnits(n.toString(), u);

const buildInitConfig = (ctx) => {
    const {timelock, adminMultiSig} = ctx;
    console.log("Timelock", timelock);
    
   const rateRanges = mintRates.map(m => new RSConfig.MintRateRangeConfig(m));
   const tokens = [];
   const feeds = [];
   feeTokens[ctx.chainId].forEach(f => {
    tokens.push(f.token);
    feeds.push(f.feed);
   });
   const feeTokenConfig = new RSConfig.FeeTokenConfig({
    feeTokens: tokens,
    priceFeeds: feeds
   });

   return new RSConfig.VaultConfig({
    ...RSConfig.VaultDefaults,
    wrappedNativeToken: nativeWrappers[ctx.chainId],
    adminMultiSig,
    timelockSeconds: timelock || TIMELOCK,
    rateRanges,
    feeTokenConfig
   });
}


class DeployCommunityVault extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "CommunityVault"
        });
    }
    

    updateContext({deployed}) {
        this.sequence.context.communityVault = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        const config = buildInitConfig(ctx);
        return [config];
    }
    
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployCommunityVault({sequence}));
}

module.exports = {
    addStep
}