
const {verify, MultiSigConfig} = require('../RSConfigBuilder');

class DexibleConfig {

    static get tupleDefinition() {
        return `(uint8,uint16,uint16,address,address,address,address,${MultiSigConfig.tupleDefinition})`
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
        this.multiSigConfig = new MultiSigConfig(props.multiSigConfig);
    }
}

module.exports = {
    DexibleConfig
}