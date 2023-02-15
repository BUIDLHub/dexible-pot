
const { ethers } = require('hardhat');
const {verify, MultiSigConfig, MultiSigDefaults} = require('../VaultConfigBuilder');

const DexibleDefaults = {
    revshareSplitRatio: 50,
    stdBpsRate: 8,
    minBpsRate: 4,
    minFeeUSD: 0 //ethers.utils.parseUnits(".05", 18).toString(),
}

class DexibleConfig {

    static get tupleDefinition() {
        return `(uint8,uint16,uint16,address,address,address,address,address,address,uint112,address[])`
    }
        
    constructor(props) {
        verify([
            'revshareSplitRatio',
            'stdBpsRate',
            'minBpsRate',
            'adminMultiSig',
            'communityVault',
            'treasury',
            'dxblToken',
            'arbGasOracle',
            'stdGasAdjustment',
            'minFeeUSD',
            'initialRelays'
        ], props);
        const ms = props.adminMultiSig.address ? props.adminMultiSig.address : props.adminMultiSig;
        this.revshareSplitRatio = props.revshareSplitRatio;
        this.stdBpsRate = props.stdBpsRate;
        this.minBpsRate = props.minBpsRate;
        this.adminMultiSig = ms;
        this.communityVault = props.communityVault;
        this.treasury = props.treasury;
        this.dxblToken = props.dxblToken;
        this.arbGasOracle = props.arbGasOracle;
        this.stdGasAdjustment = props.stdGasAdjustment;
        this.minFeeUSD = props.minFeeUSD;
        this.initialRelays = props.initialRelays;
    }
}

module.exports = {
    DexibleConfig,
    DexibleDefaults
}