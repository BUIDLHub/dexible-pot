const { DeployContext } = require("./deployUtils/DeployContext");
const { Deployer } = require("./deployUtils/Deployer");
const { DeploySequence } = require("./deployUtils/DeploySequence");
const {steps} = require("./dexibleSteps");
const {relays} = require("./relays");

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

const setDexibleRelays = async (props) => {
    const {wallets, dexible} = props;
    const rels = relays[props.chainId];

    let admin = wallets.dexibleAdmin;
    if(!admin.address) {
        const key = `0x${process.env.MAINNET_OWNER}`;
        if(!key) {
            throw new Error("Could not find MAINNET_OWNER key in env");
        }
        admin = new ethers.Wallet(key, ethers.provider);
    }

    const d = dexible.connect(admin);
    if(rels && !(await dexible.isRelay(rels[0]))) {
        console.log(`Setting ${rels.length} dexible relays`);
        await d.addRelays(rels);
    }
}

module.exports = {
    deployDexible,
    setDexibleRelays
}