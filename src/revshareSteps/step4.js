const {DeployStep} = require("../deployUtils/DeployStep");

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
        /*
        address _minter, 
                uint32 discountRate,
                string memory name, 
                string memory symbol*/
        return [ctx.revshareVault.address, 5, "Dexible.Arbitrum", "DXBL.r"];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDXBL({sequence}));
}

module.exports = {
    addStep
}