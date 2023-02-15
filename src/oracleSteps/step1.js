const {DeployStep} = require("../deployUtils/DeployStep");
const {adjustments} = require("../gasAdjustments");

class DeployArbOracle extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "ArbitrumGasOracle"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.arbGasOracle = deployed;
    }

    getDeployArgs() {
        const ctx = this.sequence.context;
        let adminMS = ctx.adminMultiSig;
        const ms = adminMS.address ? adminMS.address : adminMS;
        return [ms, MULTIPLIER];
    }
}

class DeployGasAdjustments extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "StandardGasAdjustments"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.stdGasAdjustments = deployed;
    }

    getDeployArgs() {
        const ctx = this.sequence.context;
        const adj = adjustments[ctx.chainId];
        if(!adj) {
            throw new Error("Missing gas adjustments for chain " + ctx.chainId);
        }
        let adminMS = ctx.adminMultiSig;
        const ms = adminMS.address ? adminMS.address : adminMS;
        return [ms, Object.keys(adj), Object.values(adj)];
    }
}

const addStep = async ({sequence}) => {
    if(sequence.context.chainId === 42161) {
        sequence.steps.push(new DeployArbOracle({sequence}));
    }
    sequence.steps.push(new DeployGasAdjustments({sequence}));
}

module.exports = {
    addStep
}