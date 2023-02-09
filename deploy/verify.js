
//const { HardhatRuntimeEnvironment } = require("@nomiclabs/hardhat-runtime");
const { etherscanVerify } = require("@nomiclabs/hardhat-etherscan");
const hre = require("hardhat");

const fs = require("fs");
const path = require("path");

const deploymentPath = cid => {
    const base = path.resolve(__dirname, "../deployments");
    switch(+cid) {
        case 1: return `${base}/mainnet`;
        case 5: return `${base}/goerli`;
        case 10: return `${base}/optimism`;
        case 56: return `${base}/bsc`;
        case 137: return `${base}/polygon`;
        case 250: return `${base}/fantom`;
        case 42161: return `${base}/arbitrum`;
        case 43114: return `${base}/avalanche`;
        default: throw new Error("Unsupported chain: " + cid);
    }
}


const _verifyContract = async (props) => {
    let {getChainId, contractName, proxyPath} = props;
    const chainId = await getChainId();
    console.log(`Verifying ${contractName}...`);
    const depPath = deploymentPath(chainId);
    jsonPath = path.resolve(depPath, `${contractName}.json`);
    if(!fs.existsSync(jsonPath)) {
        console.log(`${contractName} not deployed, ignoring`);
        return;
    }

    const details = await fs.readFileSync(jsonPath);
    const depDetails = JSON.parse(details);
    const {args, address} = depDetails;
    try {
        const r = await hre.run("verify:verify", {
            address: address,
            contract: proxyPath,
            constructorArguments: [
                ...args,
            ],
        });
        console.log(`${contractName} verification result: ${r}`);
    } catch (e) {
        if(e.message.indexOf("already verified") < 0) {
            //throw e;
            console.log(e);
            return;
        }
        console.log(`${contractName} already verified`);
    }
}

const verifyDXBL = async (props) => {
    await _verifyContract({
        ...props,
        contractName: "DXBL"
    });
}

const verifyCommunityVault = async (props) => {
    await _verifyContract({
        ...props,
        contractName: "CommunityVault"
    });
}

const verifyDexible = async (props) => {
    await _verifyContract({
        ...props,
        contractName: "Dexible"
    });
}

const verifyArbOracle = async (props) => {
    await _verifyContract({
        ...props,
        contractName: "ArbitrumGasOracle"
    });
}

module.exports = async (props) => {
    if(process.env.SKIP_VERIFY) {
        console.log("Skipping verification");
        return;
    }
    
    await verifyDXBL(props);
    await verifyCommunityVault(props);
   await verifyDexible(props);
   await verifyArbOracle(props);
}