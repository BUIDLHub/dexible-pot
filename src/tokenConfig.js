const tokenConfigs = {
    [1]: {
        name: "Dexible.Ethereum",
        symbol: "DXBL-ETH"
    },
    [5]: {
        name: "Dexible.Goerli",
        symbol: "DXBL-GOE"
    },
    [42161]: {
        name: "Dexible.Arbitrum",
        symbol: "DXBL-ARB"
    }
}
const discountBPS = 5;

module.exports = {
    tokenConfigs,
    discountBPS
}