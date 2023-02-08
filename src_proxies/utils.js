const {ethers} = require("hardhat");

const bn = ethers.BigNumber.from;
const inEth = ethers.utils.parseEther;
const fmtEth = ethers.utils.formatEther;
const inUnits = ethers.utils.parseUnits;
const fmtUnits = ethers.utils.formatUnits;

const units = {
    inEth,
    fmtEth,
    inUnits,
    fmtUnits
}


const alreadyDeployed = async (name, props) => {
    let lib = await props.deployments.getOrNull(name);
    if(lib) {
        props[name] = lib;
        return true;
    }
    return false;
}

const mergeAbis = (cons) => {
    const asContract = cons.map(c => new ethers.Contract(c.address, c.abi || c.interface, c.provider || ethers.provider));
    const allInterfaces = asContract.map(c => c.interface);
    let all = [];
    allInterfaces.forEach(i => {
        all = [
            ...all,
            ...i.fragments
        ]
    });
    return all;
}

module.exports = {
    bn,
    units,
    alreadyDeployed,
    mergeAbis
}