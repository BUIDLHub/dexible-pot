const { DeployContext } = require("./deployUtils/DeployContext");
const { Deployer } = require("./deployUtils/Deployer");
const { DeploySequence } = require("./deployUtils/DeploySequence");
const {steps} = require("./vaultSteps");

const deployVault = async (props, ctx) => {
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
    const {communityVault, mockMigration, dexible, ethers, dxblToken, wallets} = props;
    let admin = wallets.dexibleAdmin;
    if(!admin.address) {
        const key = `0x${process.env.MAINNET_OWNER}`;
        if(!key) {
            throw new Error("Could not find MAINNET_OWNER key in env");
        }
        admin = new ethers.Wallet(key, ethers.provider);
    }

    console.log("Using admin for vault configuration", admin.address);
    //only allowed by admin at first configuration, then requires multi-sig
    const vault = communityVault.connect(admin);
    const dex = await vault.dexibleContract();
    if(dex == ethers.constants.AddressZero) {
        console.log("Setting Dexible and DXBL Contract addresses to:", dexible.address, dxblToken.address);
        if(props.mockDexibleContract) {
            await vault.configureContracts(admin.address, dxblToken.address);
        } else {
            await vault.configureContracts(dexible.address, dxblToken.address);
        }
        if(mockMigration) {
            await mockMigration.connect(admin).configureContracts(dexible.address, dxblToken.address);
        }
    }
}

module.exports = {
    deployVault,
    setDexibleAddressesOnVault
}