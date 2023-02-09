const networks = require("./networks");

const feeTokens = {
    [networks.EthereumMainnet]: [
        {
            //USDC
            token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            feed: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6"
        },
        {
            //WETH
            token: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            feed: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
        },
        {
            //USDT
            token: "0xdac17f958d2ee523a2206206994597c13d831ec7",
            feed: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"
        },
        {
            //DAI
            token: "0x6b175474e89094c44da98b954eedeac495271d0f",
            feed: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
        }
    ],
    [networks.Goerli]: [
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
    [networks.Optimism]: [
        {
            //USDC
            token: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
            feed: "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3"
        },
        {
            //USDT
            token: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
            feed: "0xECef79E109e997bCA29c1c0897ec9d7b03647F5E"
        },
        {
            //DAI
            token: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            feed: "0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6"
        },
        {
            //WETH
            token: "0x4200000000000000000000000000000000000006",
            feed: "0x13e3Ee699D1909E989722E753853AE30b17e08c5"
        }
    ],
    [networks.BSC]: [
        {
            //BUSD
            token: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
            feed: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f"
        },
        {
            //WBNB
            token: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            feed: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"
        },
        {
            //DAI
            token: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
            feed: "0x132d3C0B1D2cEa0BC552588063bdBb210FDeecfA"
        },
        {
            //USDC
            token: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
            feed: "0x51597f405303C4377E36123cBc172b13269EA163"
        },
        {
            //USDT
            token: "0x55d398326f99059ff775485246999027b3197955",
            feed: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320"
        }
    ],
    [networks.Polygon]: [
        {
            //USDC
            token: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
            feed: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7"
        },
        {
            //WMATIC
            token: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
            feed: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
        },
        {
            //WETH
            token: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            feed: "0xF9680D99D6C9589e2a93a78A04A279e509205945"
        },
        {
            //DAI
            token: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
            feed: "0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D"
        },
        {
            //USDT
            token: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
            feed: "0x0A6513e40db6EB1b165753AD52E80663aeA50545"
        }
    ],
    [networks.Fantom]: [
        {
            //WFTM
            token: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
            feed: "0xf4766552D15AE4d256Ad41B6cf2933482B0680dc"
        },
        {
            //USDC
            token: "0x04068da6c83afcfa0e13ba15a6696662335d5b75",
            feed: "0x2553f4eeb82d5A26427b8d1106C51499CBa5D99c"
        },
        {
            //USDT
            token: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
            feed: "0xF64b636c5dFe1d3555A847341cDC449f612307d0"
        },
        {
            //WETH
            token: "0x74b23882a30290451a17c44f4f05243b6b58c76d",
            feed: "0x11DdD3d147E5b83D01cee7070027092397d63658"
        },
        {
            //DAI
            token: "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e",
            feed: "0x91d5DEFAFfE2854C7D02F50c80FA1fdc8A721e52"
        }
    ],
    [networks.Arbitrum]: [
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
    ],
    [networks.Avalanche]: [
        {
            //USDC.e
            token: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
            feed: "0xF096872672F44d6EBA71458D74fe67F9a77a23B9"
        },
        {
            //DAI.e
            token: "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
            feed: "0x51D7180edA2260cc4F6e4EebB82FEF5c3c2B8300"
        },
        {
            //WETH.e
            token: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
            feed: "0x976B3D034E162d8bD72D6b9C989d545b839003b0"
        },
        {
            //USDT.e
            token: "0xc7198437980c041c805a1edcba50c1ce5db95118",
            feed: "0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a"
        },
        {
            //WAVAX
            token: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
            feed: "0x0A77230d17318075983913bC2145DB16C7366156"
        }
    ]
}


module.exports = {
    feeTokens
}