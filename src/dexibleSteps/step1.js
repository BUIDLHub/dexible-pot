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
        this.sequence.context.dexible = new ethers.Contract(deployed.address, deployed.interface || deployed.abi, ethers.provider);
    }

    getDeployArgs() {

        const ctx = this.sequence.context;
        if(!ctx.communityVault) {
            throw new Error("No revshare vault in deployment context");
        }
        if(!ctx.dxblToken) {
            throw new Error("No DXBL token in deployment context");
        }

        const {wallets, relays, treasury, arbGasOracle, adminMultiSig} = ctx;

        const config = new DexibleConfig({
            ...DexibleDefaults,
            communityVault: ctx.communityVault.address,
            treasury: treasury || wallets.admin.address,
            dxblToken: ctx.dxblToken.address,
            adminMultiSig: adminMultiSig,
            arbGasOracle: arbGasOracle ? arbGasOracle.address : ethers.constants.AddressZero,
            initialRelays: relays
        });
        return [config];
    }
}

const addStep = async ({sequence}) => {
    sequence.steps.push(new DeployDexible({sequence}));
}

module.exports = {
    addStep
}
