const {DeployStep} = require("../deployUtils/DeployStep");

const DAY = 86400;
const TIMELOCK = DAY * 2;

class DeployLibRoleManagement extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "LibRoleManagement"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.libRoleManagement = deployed;
    }
}

class DeployLibDexible extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "LibDexible"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.libDexible = deployed;
    }
}


class DeployLibMultiSig extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "LibMultiSig"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.libMultiSig = deployed;
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployLibRoleManagement({sequence}));
    if(!sequence.context.libMultiSig) {
        sequence.steps.push(new DeployLibMultiSig({sequence}));
    }
    sequence.steps.push(new DeployLibDexible({sequence}));
}

module.exports = {
    addStep
}