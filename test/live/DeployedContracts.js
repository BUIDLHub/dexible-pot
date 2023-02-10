const chains = require("../../src/networks");
const deployedContracts = {
    Dexible: {
        [chains.Goerli]: "0x305e402685d325f9d358cf1100febac7736355cf"
    },
    DXBL: {
        [chains.Goerli]: "0xbd92815050d376b1be1c4f91436e8fe0dea1d9c4"
    },
    CommunityVault: {
        [chains.Goerli]: "0x62e7e7730e89373396d922d5e26ae9c63291a48c"
    }
}

module.exports = {
    deployedContracts
}