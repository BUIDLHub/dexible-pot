const {DeploySequence} = require("./DeploySequence");
const {DeployContext} = require("./DeployContext");
const {Deployer} = require("./Deployer");
const {DeployStep} = require("./DeployStep");

const {steps} = require("../steps");

const deployAll = async (props) => {
    const ctx = new DeployContext({
        deployments: props ? props.deployments ? props.deployments : undefined : undefined, 
        forceDeploy: props ? props.forceDeploy : false
    });
    await ctx.init();
    const seq = new DeploySequence(ctx);
    await Promise.all(steps.map(s=>s({sequence: seq})));

    await Deployer.run({sequence: seq});
    return ctx;
}

module.exports = {
    deployAll
}