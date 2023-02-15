const {DeployStep} = require("../deployUtils/DeployStep");
const {DexibleConfig, DexibleDefaults} = require("./DexibleConfig");
const { ethers } = require("hardhat");

class DeployDexible extends DeployStep {
    constructor(props) {
        super({
            ...props,
            name: "Dexible"
        });
    }

    updateContext({deployed}) {
        this.sequence.context.dexibleImpl = deployed; //new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
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
        const {dexibleImpl} = ctx;
        ctx.dexibleProxy = deployed = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
        ctx.dexible = new ethers.Contract(deployed.address, dexibleImpl.interface || dexibleImpl.abi, ethers.provider);
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        if(!ctx.communityVault) {
            throw new Error("No revshare vault in deployment context");
        }
        if(!ctx.dxblToken) {
            throw new Error("No DXBL token in deployment context");
        }

        const {dexibleImpl, stdGasAdjustments, relays, treasury, arbGasOracle, adminMultiSig} = ctx;
        const ifc = dexibleImpl.interface || new ethers.utils.Interface(dexibleImpl.abi);
        
        const ms = adminMultiSig.address ? adminMultiSig.address : adminMultiSig;
        const tr = treasury.address ? treasury.address : treasury;
        const config = new DexibleConfig({
            ...DexibleDefaults,
            communityVault: ctx.communityVault.address,
            treasury: tr,
            dxblToken: ctx.dxblToken.address,
            adminMultiSig: ms,
            arbGasOracle: arbGasOracle ? arbGasOracle.address : ethers.constants.AddressZero,
            stdGasAdjustment: stdGasAdjustments.address,
            initialRelays: relays
        });
        const cfgSig = `initialize(${DexibleConfig.tupleDefinition})`;
        const initEncoded = ifc.encodeFunctionData(cfgSig, [config]);

        return [dexibleImpl.address, ctx.timelock, initEncoded];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDexible({sequence}));
    sequence.steps.push(new DeployDexibleProxy({sequence}));
}

module.exports = {
    addStep
}
