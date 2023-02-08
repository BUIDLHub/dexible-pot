const {DeployStep} = require("../deployUtils/DeployStep");

class DeployRevshareVault extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "RevshareVault"
        });
    }

    
    getLibraries() {
        
        const ctx = this.sequence.context;
        if(!ctx.libRSUtils) {
            throw new Error("Missing LibRSUtils in sequence context");
        }
        if(!ctx.libRevshare) {
            throw new Error("Missing LibRevshare in sequence context");
        }
        return  {
            LibMultiSig: ctx.libMultiSig.address,
            LibRevshare: ctx.libRevshare.address,
            LibRSUtils: ctx.libRSUtils.address
        }
    }
    

    updateContext({deployed}) {
        this.sequence.context.revshareVaultImpl = deployed;
    }
}


const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployRevshareVault({sequence}));
}

module.exports = {
    addStep
}