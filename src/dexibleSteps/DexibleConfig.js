
const { ethers } = require('hardhat');
const {verify, MultiSigConfig, MultiSigDefaults} = require('../RSConfigBuilder');

const DexibleDefaults = {
    revshareSplitRatio: 50,
    stdBpsRate: 8,
    minBpsRate: 4,
    revshareManager: undefined,
    treasury: undefined,
    dxblToken: undefined,
    roleManager: undefined,
    minFeeUSD: ethers.utils.parseUnits(".05", 18).toString(),
    multiSigConfig: undefined
}

class DexibleConfig {

    static get tupleDefinition() {
        return `(uint8,uint16,uint16,address,address,address,address,uint112,${MultiSigConfig.tupleDefinition})`
    }
        
    constructor(props) {
        verify([
            'revshareSplitRatio',
            'stdBpsRate',
            'minBpsRate',
            'revshareManager',
            'treasury',
            'dxblToken',
            'roleManager',
            'multiSigConfig'
        ], props);
        this.revshareSplitRatio = props.revshareSplitRatio;
        this.stdBpsRate = props.stdBpsRate;
        this.minBpsRate = props.minBpsRate;
        this.revshareManager = props.revshareManager;
        this.treasury = props.treasury;
        this.dxblToken = props.dxblToken;
        this.roleManager = props.roleManager;
        this.minFeeUSD = props.minFeeUSD || 0;
        this.multiSigConfig = new MultiSigConfig(props.multiSigConfig);
    }
}

module.exports = {
    DexibleConfig,
    DexibleDefaults
}