const {USDC_BY_NET} = require('./commonAddresses');
const { ethers } = require('ethers');
const erc20 = require('./abi/ERC20ABI.json');
const {units} = require("../../src/utils");

const slots = {
    1: 9,
    137: 0,
    42161: 51
}
//const SLOT = 0; //9; //mapping of balances memory slot for USDC contract (derived using slot20 utility)

const toBytes32 = (bn) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
  };

  const setStorageAt = async (provider, address, index, value) => {
    await provider.send("hardhat_setStorageAt", [address, index, value]);
    await provider.send("evm_mine", []); // Just mines to the next block
  };

const asTokenContract = (provider, chain) => new ethers.Contract(USDC_BY_NET[chain||1], erc20, provider);

const asToken = (chain) => ({
    address: USDC_BY_NET[chain||1],
    decimals: 6
})

const setBalance = async (props) => {
    const {
        ethers,
        provider,
        chain,
        tgtAddress,
        balance
    } = props;
    const slot = slots[chain || 1];
    const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tgtAddress, slot]).replace(/0x0*/, '0x');
    const addr = USDC_BY_NET[chain || 1];

    await setStorageAt(
        provider || ethers.provider,
        addr,
        index, 
        toBytes32(units.inUnits((+balance).toFixed(6), 6)).toString()
    );
}

const approveSpending = async (props) => {
    const {
        ethers,
        provider,
        spender,
        owner
    } = props;
    const chain = +(await (provider||ethers.provider).getNetwork()).chainId;
    await asTokenContract(provider || ethers.provider, chain).connect(owner).approve(spender, ethers.constants.MaxUint256);
}

module.exports = {
    setBalance,
    asToken,
    asTokenContract,
    approveSpending
}