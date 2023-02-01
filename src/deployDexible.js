const { DeployContext } = require("./deployUtils/DeployContext");
const { Deployer } = require("./deployUtils/Deployer");
const { DeploySequence } = require("./deployUtils/DeploySequence");
const {steps} = require("./dexibleSteps");

const deployDexible = async (props, ctx) => {
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

module.exports = {
    deployDexible
}