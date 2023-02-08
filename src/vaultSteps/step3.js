const {DeployStep} = require("../deployUtils/DeployStep");

class DeployMockMigration extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "MockMigration"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.mockMigration = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
    }
}

const addStep = async ({sequence}) => {
    const ctx = sequence.context;
    if(ctx.isTest) {
        sequence.steps.push(new DeployMockMigration({sequence}));
    }
}

module.exports = {
    addStep
}