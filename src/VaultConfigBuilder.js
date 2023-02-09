const { ethers } = require("hardhat");
const { USD_PRECISION } = require("./constants");
const {nativeTokens} = require("./nativeTokens");

//7 days
const TIMELOCK = 7 * 86400;

const verify = (fields, props) => {
    fields.forEach(f => {
        const v = props[f];
        if(v === undefined || v === null) {
            throw new Error("Missing required field " + f);
        }
    });
}


class MintRateRangeConfig {
  
    static get tupleDefinition() {
        return "(uint16,uint16,uint)";
    }
    constructor(props) {
        verify(['minMMVolume','maxMMVolume','rate'], props);
        this.minMMVolume = props.minMMVolume;
        this.maxMMVolume = props.maxMMVolume;
        this.rate = props.rate;
    }
}

class FeeTokenConfig {
    
    static get tupleDefinition() {
        return "(address[],address[])";
    }
    constructor(props) {
        verify(['feeTokens', 'priceFeeds'], props);
        this.feeTokens = props.feeTokens;
        this.priceFeeds = props.priceFeeds;
    }
}

const VaultDefaults = {
    timelockSeconds: TIMELOCK,
    baseMintThreshold: ethers.utils.parseUnits("100", USD_PRECISION),
}

class VaultConfig {
    //how long to wait before changes take effect

    static get tupleDefinition() {
        return `(address,address,uint32,uint,${MintRateRangeConfig.tupleDefinition}[],${FeeTokenConfig.tupleDefinition})`
    }

   constructor(props) {
    verify([
        'wrappedNativeToken',
        'adminMultiSig',
        'baseMintThreshold',
        'timelockSeconds',
        'rateRanges',
        'feeTokenConfig'
    ], props);
    const ms = props.adminMultiSig.address ? props.adminMultiSig.address : props.adminMultiSig;
    this.wrappedNativeToken = props.wrappedNativeToken;
    this.adminMultiSig = ms;
    this.baseMintThreshold = props.baseMintThreshold;
    this.timelockSeconds = props.timelockSeconds;
    
    if(!Array.isArray(props.rateRanges)) {
        throw new Error("Rate ranges must be an array of range settings");
    }
    this.rateRanges = props.rateRanges.map(r => new MintRateRangeConfig(r));
    this.feeTokenConfig = new FeeTokenConfig(props.feeTokenConfig);
   }
}

module.exports = {
    verify,
    VaultConfig,
    VaultDefaults,
    FeeTokenConfig,
    MintRateRangeConfig
}