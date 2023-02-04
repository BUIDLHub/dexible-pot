const {deployAll} = require("../src/deployAll");

const buildConfig = async (props) => {
    let {getUnnamedAccounts, deployments, getChainId} = props;
    
    const wallets = await getUnnamedAccounts();

    const dexibleAdmin = wallets[0];
    const approvers = [
        '0xb631E8650fB4bEfDAe74Ab9f86a9Cb65bC134706',
        '0xb52DA078937DC8a4614bAfbe98523535eb755C0C'
    ];
    const treasury = dexibleAdmin; //for now but should be SAFE address on specific chain
    const roleManager = dexibleAdmin;
    const cid = await getChainId();
    const ctx = {
        deployments,
        pauseMS: 5000,
        chainId: cid,
        wallets: {
            all: wallets,
            owner: dexibleAdmin,
            admin: dexibleAdmin,
            dexibleAdmin
        },
        approvers,
        treasury: treasury.address ? treasury.address : treasury,
        roleManager: roleManager.address ? roleManager.address : roleManager
    }
    return ctx;
}

module.exports = async (props) => {
    const ctx = await buildConfig(props);
    await deployAll(ctx);
}