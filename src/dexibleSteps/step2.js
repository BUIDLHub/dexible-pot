const {DeployStep} = require("../deployUtils/DeployStep");

const DAY = 86400;
const TIMELOCK = DAY * 2;

class DeploySwapExtension extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "SwapExtension"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.swapExtension = deployed;
    }
}


const addStep = async ({sequence}) => {
    sequence.steps.push(new DeploySwapExtension({sequence}));
}

module.exports = {
    addStep
}