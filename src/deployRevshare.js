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
    const {revshareVault, dexible, ethers, dxblToken, wallets} = props;
    let admin = wallets.dexibleAdmin;
    if(!admin.address) {
        const key = `0x${process.env.MAINNET_OWNER}`;
        if(!key) {
            throw new Error("Could not find MAINNET_OWNER key in env");
        }
        admin = new ethers.Wallet(key, ethers.provider);
    }

    const vault = revshareVault.connect(admin);
    const dex = await vault.getDexibleContract();

    if(dex == "0x0000000000000000000000000000000000000000") {
        console.log("Setting Dexible and DXBL Contract addresses to:", dexible.address, dxblToken.address);
        await Promise.all([
            vault.setDexible(dexible.address),
            vault.setDXBL(dxblToken.address)
        ]);
    }
}

module.exports = {
    deployRevshare,
    setDexibleAddressesOnVault
}