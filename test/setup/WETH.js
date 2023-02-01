const {WETH_BY_NET} = require('./commonAddresses');
const {units} = require("../../src/utils");
const {ethers} = require("ethers");
const erc20 = require("./abi/ERC20ABI.json");

const slots = {
    1: 3,
    137: 0,
    42161: 51
}

//const SLOT = 0; //3; //mapping of balances memory slot for USDC contract (derived using slot20 utility)

const toBytes32 = (bn) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
  };

  const setStorageAt = async (provider, address, index, value) => {
    await provider.send("hardhat_setStorageAt", [address, index, value]);
    await provider.send("evm_mine", []); // Just mines to the next block
  };

const setBalance = async (props) => {
    const {
        ethers,
        chain,
        provider,
        tgtAddress,
        balance
    } = props;
    const slot = slots[chain || 1];
    const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tgtAddress, slot]).replace(/0x0*/, '0x');
    await setStorageAt(
        provider || ethers.provider,
        WETH_BY_NET[chain || 1], 
        index, 
        toBytes32(units.inUnits(""+balance, 18)).toString()
    );
}

const asTokenContract =  (provider, chain) => new ethers.Contract(WETH_BY_NET[chain||1], erc20, provider);

const asToken = (chain) => ({
    address: WETH_BY_NET[chain||1],
    decimals: 18
})

module.exports = {
    setBalance,
    asToken,
    asTokenContract
}