const {deployAll} = require("../src/deployAll");
const {multiSigs} = require("../src/multiSigs");

const buildConfig = async (props) => {
    let {getUnnamedAccounts, deployments, getChainId} = props;
    
    const wallets = await getUnnamedAccounts();

    const dexibleAdmin = wallets[0];
   
    const treasury = multiSigs[props.chainId] || dexibleAdmin; //for now but should be SAFE address on specific chain
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
        treasury: treasury.address ? treasury.address : treasury,
    }
    return ctx;
}

module.exports = async (props) => {
    const ctx = await buildConfig(props);
    await deployAll(ctx);
}