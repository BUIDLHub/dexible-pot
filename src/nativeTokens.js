const networks = require("./networks");

const nativeTokens = {
    [networks.EthereumMainnet]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    [networks.Goerli]: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    [networks.Arbitrum]: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    [networks.Optimism]: "0x4200000000000000000000000000000000000006",
    [networks.BSC]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    [networks.Polygon]: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    [networks.Fantom]: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
    [networks.Avalanche]: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"
}

module.exports = {
    nativeTokens
}