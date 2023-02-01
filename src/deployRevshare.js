const { DeployContext } = require("./deployUtils/DeployContext");
const { Deployer } = require("./deployUtils/Deployer");
const { DeploySequence } = require("./deployUtils/DeploySequence");
const {steps} = require("./revshareSteps");

const deployRevshare = async (props, ctx) => {
    if(!ctx) {
         ctx = new DeployContext({
            ...props,
            deployments: props ? props.deployments ? props.deployments : undefined : undefined, 
            forceDeploy: props ? props.forceDeploy : false
        });
        await ctx.init();
    }
   
    const seq = new DeploySequence(ctx);
    await Promise.all(steps.map(s=>s({sequence: seq})));

    await Deployer.run({sequence: seq});
    return ctx;
}

const setDexibleAddressesOnVault = async (props) => {
    const {revshareVault, dexible, dxblToken, wallets} = props;
    const vault = revshareVault.connect(wallets.dexibleAdmin);
    await vault.setDexible(dexible.address);
    await vault.setDXBL(dxblToken.address);
}

module.exports = {
    deployRevshare,
    setDexibleAddressesOnVault
}