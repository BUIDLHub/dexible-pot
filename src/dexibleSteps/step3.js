const {DeployStep} = require("../deployUtils/DeployStep");
const {DexibleConfig, DexibleDefaults} = require("./DexibleConfig");
const {MultiSigConfig, MultiSigDefaults} = require("../RSConfigBuilder");
const { ethers } = require("hardhat");

class DeployDexible extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "Dexible"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.dexibleImpl = deployed;
    }

    getLibraries() {
        if(!this.sequence.context.swapExtension) {
            throw new Error("Missing SwapExtension in sequence context");
        }
        if(!this.sequence.context.libRoleManagement) {
            throw new Error("Missing LibRoleManagmeent in sequence context");
        }
        if(!this.sequence.context.libMultiSig) {
            throw new Error("Missing LibMultiSig in sequence context");
        }
        if(!this.sequence.context.libDexible) {
            throw new Error("Missing LibDexible in sequence context");
        }
        const ctx = this.sequence.context;
        return  {
            SwapExtension: ctx.swapExtension.address,
            LibMultiSig: ctx.libMultiSig.address,
            LibRoleManagement: ctx.libRoleManagement.address,
            LibDexible: ctx.libDexible.address
        }
    }
}

class DeployDexibleProxy extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "DexibleProxy"
        });
    }

    updateContext({deployed}) {
        const ctx = this.sequence.context;
        ctx.dexible = new ethers.Contract(deployed.address, ctx.dexibleImpl.interface || ctx.dexibleImpl.abi, ethers.provider);
    }

    getDeployerWallet() {
        const ctx = this.sequence.context;
        const wallets = ctx.wallets.all;
        ctx.wallets.dexibleAdmin = ctx.dexibleAdmin || wallets[wallets.length-1];
        console.log("Dexible admin is", ctx.wallets.dexibleAdmin.address);
        return ctx.wallets.dexibleAdmin;
    }

    getLibraries() {
       
        if(!this.sequence.context.libMultiSig) {
            throw new Error("Missing LibMultiSig in sequence context");
        }
        const ctx = this.sequence.context;
        return  {
            LibMultiSig: ctx.libMultiSig.address
        }
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        if(!ctx.revshareVault) {
            throw new Error("No revshare vault in deployment context");
        }
        if(!ctx.dxblToken) {
            throw new Error("No DXBL token in deployment context");
        }

        const {wallets, approvers, treasury, roleManager} = ctx;
        const app1 = approvers ? approvers[0] : wallets.all[wallets.all.length-1];
        const app2 = approvers ? approvers[1] : wallets.all[wallets.all.length-2];

        const config = new DexibleConfig({
            ...DexibleDefaults,
            revshareManager: ctx.revshareVault.address,
            treasury: treasury || ctx.wallets.admin.address,
            dxblToken: ctx.dxblToken.address,
            roleManager: roleManager || ctx.wallets.owner.address,
            multiSigConfig: new MultiSigConfig({
                ...MultiSigDefaults,
                logic: ctx.dexibleImpl.address,
                approvers: [
                    app1.address?app1.address:app1,
                    app2.address?app2.address:app2
                ]
            })
        });
        //const impl = new ctx.ethers.Contract(ctx.dexibleImpl.address, ctx.dexibleImpl.interface || ctx.dexibleImpl.abi, ctx.wallets.owner);
        const ifc = ctx.dexibleImpl.interface || new ethers.utils.Interface(ctx.dexibleImpl.abi);
        const cfgSig = `initialize(${DexibleConfig.tupleDefinition})`;

        const init = ifc.encodeFunctionData(cfgSig, [config]);
        return [ctx.dexibleImpl.address, init];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDexible({sequence}));
    sequence.steps.push(new DeployDexibleProxy({sequence}));
}

module.exports = {
    addStep
}
