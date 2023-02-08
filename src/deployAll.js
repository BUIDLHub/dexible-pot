const { DeployContext } = require("./deployUtils/DeployContext");

const {deployDexible, setDexibleRelays} = require("./deployDexible");
const {deployVault, setDexibleAddressesOnVault} = require("./deployVault");
const { deployArbOracle } = require("./deployArbOracle");

const deployAll = async (props) => {
    const ctx = new DeployContext({
        ...props,
        deployments: props ? props.deployments ? props.deployments : undefined : undefined, 
        forceDeploy: props ? props.forceDeploy : false
    });
    await ctx.init();
    await deployVault(props, ctx);
    await deployArbOracle(props, ctx);
    await deployDexible(props, ctx);
    await setDexibleAddressesOnVault(ctx);
    //await setDexibleRelays(ctx);
    const {dxblToken, dexible, communityVault, arbGasOracle} = ctx;
    console.group("---------------- FINAL ADDRESSES ---------------------");
        console.log("DXBL", dxblToken.address);
        console.log("CommunityVault", communityVault.address);
        console.log("Dexible", dexible.address);
        console.log("ArbGasOracle", arbGasOracle.address);
    console.groupEnd();
    
    return ctx;
}

module.exports = {
    deployAll
}