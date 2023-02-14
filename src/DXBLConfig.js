const networks = require("./networks");

const tokenConfigs = {
    [networks.EthereumMainnet]: {
        name: "Dexible.Ethereum",
        symbol: "DXBL-ETH"
    },
    [networks.Goerli]: {
        name: "Dexible.Goerli",
        symbol: "DXBL-GOE"
    },
    [networks.Arbitrum]: {
        name: "Dexible.Arbitrum",
        symbol: "DXBL-ARB"
    },
    [networks.Avalanche]: {
        name: "Dexible.Avalanche",
        symbol: "DXBL-AVA"
    },
    [networks.BSC]: {
        name: "Dexible.BNBChain",
        symbol: "DXBL-BNB"
    },
    [networks.Optimism]: {
        name: "Dexible.Optimism",
        symbol: "DXBL-OPT"
    },
    [networks.Polygon]: {
        name: "Dexible.Polygon",
        symbol: "DXBL-POL"
    }
}
const discountBPS = 5;

module.exports = {
    tokenConfigs,
    discountBPS
}