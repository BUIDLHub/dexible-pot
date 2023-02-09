
const feeTokens = {
    [1]: [
        {
            //USDC
            token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            feed: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6"
        },
        {
            //WETH
            token: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            feed: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
        }
    ],
    [5]: [
        {
            //USDC
            token: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
            feed: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7"
        },
        {
            //WETH
            token: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
            feed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
        }
    ],
    [42161]: [
        {
            //USDC
            token: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
            feed: "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3"
        },
        {
            //USDT
            token: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            feed: "0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7"
        },
        {
            //DAI
            token: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
            feed: "0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb"
        },
        {
            //WETH
            token: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
            feed: "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612"
        }
    ]
}


module.exports = {
    feeTokens
}