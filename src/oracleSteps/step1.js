const {DeployStep} = require("../deployUtils/DeployStep");
const {MULTIPLIER} = require("./OracleConfig");
const {multiSigs} = require("../multiSigs");

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
        if(!adminMS) {
            adminMS = multiSigs[ctx.chainId];
        }
        const ms = adminMS.address ? adminMS.address : adminMS;
        return [ms, MULTIPLIER];
    }
}

const addStep = async ({sequence}) => {
    if(sequence.context.chainId === 42161) {
        sequence.steps.push(new DeployArbOracle({sequence}));
    }
}

module.exports = {
    addStep
}