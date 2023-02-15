const {deployAll} = require("../src/deployAll");
const {multiSigs} = require("../src/multiSigs");
const networks = require("../src/networks");

const pauses = {
    [networks.Polygon]: 30000,
    [networks.Arbitrum]: 5000,
    [networks.Avalanche]: 10000,
    [networks.BSC]: 5000,
    [networks.EthereumMainnet]: 5000,
    [networks.Goerli]: 10000,
    [networks.Optimism]: 5000,
}

const DAY = 86400;
const TIMELOCK = 7 * DAY;

const buildConfig = async (props) => {
    let {getUnnamedAccounts, deployments, getChainId} = props;
    
    const wallets = await getUnnamedAccounts();

    const dexibleAdmin = wallets[0];
   
    const treasury = multiSigs[props.chainId] || dexibleAdmin; //for now but should be SAFE address on specific chain
    const cid = await getChainId();
    const ctx = {
        deployments,
        pauseMS: pauses[cid],
        chainId: cid,
        //do not upgrade Vault since it requires migration
        skipUpgrades: {
            DXBL: true,
            CommunityVault: true
        },
        timelock: TIMELOCK,
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