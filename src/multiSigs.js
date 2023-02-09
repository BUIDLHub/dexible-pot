const networks = require("./networks");

const multiSigs = {
    [networks.EthereumMainnet]: "0x5DB6E1b7CE743a2D49B2546B3ebE17132E0Ab04d",
    [networks.Goerli]: "0x13b9Ec49fB5845D5cb867d7932d71F712D47044c",
    [networks.Arbitrum]: "0xf730893c59A34aD45714a6080093DF8a4B95616B",
    [networks.Optimism]: "0x026267C690F450C6d389953691F26B9a03450a4C",
    [networks.Avalanche]: "0x9C5816f9fffe4B29DEA929862dAF98C5FB1A19E8",
    [networks.BSC]: "0x3c6fEDE13Ca85473A0BB29D978Be7d2550825Cbc",
    [networks.Fantom]: undefined, //not likely to support
    [networks.Polygon]: "0x83a8D7D4DbfeC0175e80306cC33c916D8FA9B0BD",
}

module.exports = {
    multiSigs
}