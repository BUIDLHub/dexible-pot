const {DeployStep} = require("../deployUtils/DeployStep");

class DeployLibRevshare extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "LibRevshare"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.libRevshare = deployed;
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



class DeployLibRSUtils extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "LibRSUtils"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.libRSUtils = deployed;
    }
}


const addStep = async ({sequence}) => {

    sequence.steps.push(new DeployLibMultiSig({sequence}));
    sequence.steps.push(new DeployLibRevshare({sequence}));
    sequence.steps.push(new DeployLibRSUtils({sequence}));
}

module.exports = {
    addStep
}