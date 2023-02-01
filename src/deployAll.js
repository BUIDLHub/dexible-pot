const { DeployContext } = require("./deployUtils/DeployContext");

const {deployDexible} = require("./deployDexible");
const {deployRevshare, setDexibleAddressesOnVault} = require("./deployRevshare");

const deployAll = async (props) => {
    const ctx = new DeployContext({
        ...props,
        deployments: props ? props.deployments ? props.deployments : undefined : undefined, 
        forceDeploy: props ? props.forceDeploy : false
    });
    await ctx.init();
    await deployRevshare(props, ctx);
    await deployDexible(props, ctx);
    await setDexibleAddressesOnVault(ctx);
    return ctx;
}

module.exports = {
    deployAll
}