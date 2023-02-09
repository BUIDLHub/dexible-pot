
const dotenv = require('dotenv');
dotenv.config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

const accounts = [
  `0x${process.env.MAINNET_OWNER}`, 
  `0x${process.env.MAINNET_PROXY_ADMIN}`
]

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      }
    }
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ETHERSCAN_KEY_arbitrum,
      goerli: process.env.ETHERSCAN_KEY_goerli
    }
  },
  networks: {
    hardhat: {
      //mining: {
      //  auto: false,
      //  interval: 100
      //},
      //gas: 30000000000,
      //gasLimit: 600000,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      chainId: 1,
      //chainId: 42161,
      //chainId: 43114,
      //chainId: 137,
      //chainId: 3,
      forking: {
        //url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
        //url: 'https://api.avax.network/ext/bc/C/rpc',
        //blockNumber: 19871939
        //url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
        //url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID}`, 
      }
    },
    mainnet: {
      gas: 80000000000,
      gasPrice: 23000000000,
      allowUnlimitedContractSize: true,
      timeout: 600000,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts
    },
    polygon: {
      gas: 80000000000,
      gasPrice: 110000000000,
      allowUnlimitedContractSize: true,
      timeout: 6000000,
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 25000000000,
      chainId: 43114,
      accounts
    },
    bsc: {
      url: "https://bsc-dataseed1.ninicoin.io",
      gasPrice: 5000000000,
      chainId: 56,
      accounts
    },
    fantom: {
      url: "https://rpc.ftm.tools",
      gasPrice: 1130000000000,
      chainId: 250,
      accounts
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      gasPrice: 8000000000,
      chainId: 5,
      accounts
    },
    arbitrum: {
      chainId: 42161,
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      gasPrice: 200000000,
      accounts
    },
    optimism: {
      chainId: 10,
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      gasPrice: 20000000,
      accounts
    }
  }
};
