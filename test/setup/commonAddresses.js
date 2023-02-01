

const WETH_BY_NET = {
    1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
}

const WETH = WETH_BY_NET[1];

const USDC_BY_NET = {
    1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    137: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
}
const USDC = USDC_BY_NET[1];

const MATIC_BY_NET = {
    1: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
    137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
}

const MATIC = MATIC_BY_NET[1];

module.exports = {
    WETH_BY_NET,
    USDC_BY_NET,
    MATIC_BY_NET,

    WETH,
    USDC,
    MATIC,

}