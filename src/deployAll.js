const { DeployContext } = require("./deployUtils/DeployContext");

const {deployDexible} = require("./deployDexible");
const {deployVault, setDexibleAddressesOnVault} = require("./deployVault");
const { deployArbOracle } = require("./deployArbOracle");
const {relays} = require("./relays");
const {multiSigs} = require("./multiSigs");
const {nativeTokens} = require("./nativeTokens");


const deployAll = async (props) => {
    const ctx = new DeployContext({
        ...props,
        deployments: props ? props.deployments ? props.deployments : undefined : undefined, 
        forceDeploy: props ? props.forceDeploy : false
    });
    await ctx.init();
    if(!ctx.adminMultiSig) {
        ctx.adminMultiSig = multiSigs[ctx.chainId];
    }
    ctx.treasury = ctx.adminMultiSig.address ? ctx.adminMultiSig.address : ctx.adminMultiSig;
    
    if(!ctx.relays) {
        const rels = relays[ctx.chainId];
        ctx.relays = rels;
    }
    ctx.wrappedNativeToken = ctx.wrappedNativeToken || nativeTokens[ctx.chainId];
    
    await deployVault(props, ctx);
    await deployArbOracle(props, ctx);
    await deployDexible(props, ctx);
    await setDexibleAddressesOnVault(ctx);
    const {dxblToken, dexibleImpl, stdGasAdjustments, dexible, communityVault, arbGasOracle} = ctx;
    console.group("---------------- FINAL ADDRESSES ---------------------");
        console.log("DXBL", dxblToken.address);
        console.log("CommunityVault", communityVault.address);
        console.log("DexibleImpl", dexibleImpl.address);
        console.log("Dexible", dexible.address);
        console.log("ArbGasOracle", arbGasOracle?arbGasOracle.address:ethers.constants.AddressZero);
        console.log("StdGasAdjustments", stdGasAdjustments.address);
    console.groupEnd();
    
    return ctx;
}

module.exports = {
    deployAll
}