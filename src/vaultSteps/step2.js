const {DeployStep} = require("../deployUtils/DeployStep");
const {tokenConfigs, discountBPS} = require("../DXBLConfig");

class DeployDXBL extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "DXBL"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.dxblToken = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        const info = tokenConfigs[ctx.chainId];
        const bps = discountBPS;
        return [ctx.communityVault.address, bps, info.name, info.symbol];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDXBL({sequence}));
}

module.exports = {
    addStep
}