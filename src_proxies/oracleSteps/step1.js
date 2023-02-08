const {DeployStep} = require("../deployUtils/DeployStep");
const {MULTIPLIER} = require("./OracleConfig");

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
        return [MULTIPLIER];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployArbOracle({sequence}));
}

module.exports = {
    addStep
}