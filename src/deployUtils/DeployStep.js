
class DeployStep {

    constructor({sequence, name, isDeployment, isProxy}) {
        this.sequence = sequence;
        this.name = name;
        this.isDeployment = isDeployment === undefined ? true : isDeployment;
        this.deployedNew = false;
        this.isProxy = isProxy === undefined ? false : isProxy;
        this.index = sequence.steps.length;
    }

    getLibraries() {
        return undefined;
    }

    getDeployerWallet() {
        return this.sequence.context.wallets.owner;
    }

    async getDeployArgs() {
        return undefined;
    }
    
    async updateContext() {
        throw new Error("Missing context update impl");
    }

    async maybeUpgrade() {
        //only relevant for proxy deployments
    }

    async run() {
        
    }
}

module.exports = {
    DeployStep
}