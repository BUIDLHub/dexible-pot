const { ethers } = require("hardhat");
const {DeployStep} = require("../deployUtils/DeployStep");
const RSConfig = require("../VaultConfigBuilder");
const {mintRates} = require("./mintRates");
const {feeTokens} = require("../feeTokens");
const {USD_PRECISION} = require("../constants");
const DAY = 86400;
const TIMELOCK = 7 * DAY;
const BPS = 10_000;

const inUnits = (n,u) => ethers.utils.parseUnits(n.toString(), u);

const buildInitConfig = (ctx) => {
    const {timelock, adminMultiSig, wrappedNativeToken} = ctx;
    
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

   const ms = adminMultiSig.address ? adminMultiSig.address : adminMultiSig;
   return new RSConfig.VaultConfig({
    ...RSConfig.VaultDefaults,
    wrappedNativeToken,
    adminMultiSig: ms,
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

class DeployMockMigration extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "MockMigration"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.mockMigration = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        const config = buildInitConfig(ctx);
        return [config];
    }
}

const addStep = async ({sequence}) => {
    const ctx = sequence.context;
    sequence.steps.push(new DeployCommunityVault({sequence}));
    if(ctx.isTest) {
        sequence.steps.push(new DeployMockMigration({sequence}));
    }
}

module.exports = {
    addStep
}