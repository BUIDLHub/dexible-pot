const {UNI_BY_NET} = require('./commonAddresses');
const {units} = require("../../src/utils");
const {ethers} = require("ethers");
const erc20 = require("./abi/ERC20ABI.json");


const asTokenContract =  (provider, chain) => new ethers.Contract(UNI_BY_NET[chain||1], erc20, provider);

const asToken = (chain) => ({
    address: UNI_BY_NET[chain||1],
    decimals: 18
})

module.exports = {
    asToken,
    asTokenContract
}