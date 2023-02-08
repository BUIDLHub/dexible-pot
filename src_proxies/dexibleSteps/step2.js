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

    getLibraries() {
       
        if(!this.sequence.context.libFees) {
            throw new Error("Missing LibFees in sequence context");
        }
        const ctx = this.sequence.context;
        return  {
            LibFees: ctx.libFees.address
        }
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