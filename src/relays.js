const networks = require("./networks");

const relays = {
    [networks.EthereumMainnet]: [
        "0x219471f3dea5a0542821c32cfeca9a225e1473bf",
        "0x32d070599e3472a82c2b2f599f5599692b1e9066",
        "0x025400e2f9f2484ed193452b57e04144573d8054",
        "0xfc6f0bf297ae9cf34b4e2fea904c33673d78123c",
        "0xa410c70e4a1fa1a494d0a0d0be199085e0f175a1",
        "0x405b55d4ba75320632f17ea17915fa8df30ff411",
        "0xb8f9f1235788ff47687d9a9cc35b41197cd04841",
        "0x0e44a8730c247bf1f679a587518a319ea469a105"
    ],
    [networks.Goerli]: [
        "0x4980f0d63a9a0b6cc4c71a875b266d39dfaf89a2",
        "0x697b21ada47644027d7cd00343e5f9fa46852191",
        "0x038060d2bc338382721ccf23b42305a37025405f",
        "0x676dd869728880a3328da13f5872e6e2602ef6fb"
    ],
    [networks.Optimism]: [
        "0xe0cae00e90b5ea8b2bfaeaee2e177fd5dd76a3fb",
        "0x8902a4b3add6e63cbf7418a12613e5c68b382caa",
        "0x1a877e2c1b41ccad0a5994a7b70d266cf1d53401",
        "0x534713927eca227c720f61d139b109a399c802fd"
    ],
    [networks.Avalanche]: [
        "0x9fc89dfc0467012cc67dfa27c32453f01848b712",
        "0x3ddf02ed7cd8cd6de288a13962cf028fda7e4d72",
        "0x3546bf6dded4e288ba15355320adf20c46ad4eba",
        "0x867cf6cbe60009196f77c814248cddbca844fc32"
    ],
    [networks.BSC]: [
        "0x52bdd6d9ecc0044e64c13eb89b6c5036afc3ce53",
        "0x3eb45f1442bcc244717fe44584890454fc1a0976",
        "0x7c8046979e081bc78e4830cf9f8e07d6ed799aa1"
    ],
    [networks.Fantom]: [
        "0x19bbe9e5aaea0a5ac3ba04fa1db3db54ea7dfcb1",
        "0x5ae7849016fc8a2dd5b82fa4eb766486082d8b82",
        "0x3ded1dbc5a30be3990440de8403f6c93331c337f",
        "0x6c1356dcec97b0f6827575c25d3511456d2b0098"
    ],
    [networks.Polygon]: [
        "0x013bf573fa2dfec3467ff7b4161b7b90054816e9",
        "0x22a7f3260e3bea01646c5c379fb12add6604826a",
        "0x166a8105abd117b4e030977900747a8817037161",
        "0xfe78e730fa62cdd46bcc3cebf18fa1d204fb5397",
        "0x4c96a8affef7e3025758f6b33f99a17482bef531",
        "0x8a18051d3888ca1385661b5dcb66ad8b27433975"
    ],
    [networks.Arbitrum]: [
        "0x9e8052aaa3df98991b4a91d9e074dc6d7ee2a94e",
        "0x1391b4c1693b4806a086ecf5204c557b7a162939",
        "0x799e3e2d6b86059cffbffa79bc96e5954aae4023",
        "0xf450b5e343ea6e9632a765f0ee99774aad88f73e",
        "0x4e18b1425697ca22fa8c5867cbbb9a46f71c079a",
        "0x04e36c8066710d11b3213e47711846678c529b33",
        "0x5b7c363a0fd3da90c9a3695494fef7a35eba7a19",
        "0x45eaa1a794396863d3cc28960c04bc3b60b7c30a"
    ]
}

module.exports = {
    relays
}