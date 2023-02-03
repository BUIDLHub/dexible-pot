const { ethers } = require("hardhat");
const { USD_PRECISION } = require("./constants");

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

const MultiSigDefaults = {
    requiredSigs: 2,
    timelockSeconds: 2 * 86400,
    logic: undefined,
    approviders: []
}

class MultiSigConfig {
    static get tupleDefinition() {
        return '(uint8,uint32,address,address[])';
    }

    constructor(props) {
        verify(['requiredSigs', 'timelockSeconds', 'logic', 'approvers'], props);
        this.requiredSigs = +props.requiredSigs;
        this.approvers = props.approvers;
        this.timelockSeconds = props.timelockSeconds;
        this.logic = props.logic;
        if(!Array.isArray(this.approvers)) {
            throw new Error("Approvers must be an array of addresses");
        }
    }
}

const RevshareDefaults = {
    wrappedNativeToken: undefined,
    baseMintThreshold: ethers.utils.parseUnits("100", USD_PRECISION),
    rateRanges: undefined,
    multiSigConfig: undefined
}

class RevshareConfig {
    //how long to wait before changes take effect

    static get tupleDefinition() {
        return `(address,uint,${MintRateRangeConfig.tupleDefinition}[],${FeeTokenConfig.tupleDefinition},${MultiSigConfig.tupleDefinition})`
    }

   constructor(props) {
    verify([
        'wrappedNativeToken',
        'baseMintThreshold',
        'rateRanges',
        'feeTokenConfig',
        'multiSigConfig'
    ], props);
    this.baseMintThreshold = props.baseMintThreshold;
    this.wrappedNativeToken = props.wrappedNativeToken;
    if(!Array.isArray(props.rateRanges)) {
        throw new Error("Rate ranges must be an array of range settings");
    }
    this.rateRanges = props.rateRanges.map(r => new MintRateRangeConfig(r));
    this.feeTokenConfig = new FeeTokenConfig(props.feeTokenConfig);
    this.multiSigConfig = new MultiSigConfig(props.multiSigConfig);
   }
}

module.exports = {
    verify,
    RevshareConfig,
    RevshareDefaults,
    FeeTokenConfig,
    MintRateRangeConfig,
    MultiSigDefaults,
    MultiSigConfig
}