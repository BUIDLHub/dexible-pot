const {DeployStep} = require("../deployUtils/DeployStep");
const {tokenConfigs, discountBPS} = require("../tokenConfig");

class DeployDXBL extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "DXBL"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.dxblToken = deployed;
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        const info = tokenConfigs[ctx.chainId];
        const bps = discountBPS;
        /*
        address _minter, 
                uint32 discountRate,
                string memory name, 
                string memory symbol*/
        return [ctx.revshareVault.address, bps, info.name, info.symbol];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDXBL({sequence}));
}

module.exports = {
    addStep
}