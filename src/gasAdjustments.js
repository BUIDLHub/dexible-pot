const networks = require("./networks");

const SWAP_OK = "SWAP_SUCCESS";
const SWAP_BAD = "SWAP_FAILURE";

const adjustments = {
    [networks.Arbitrum]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 90_000
    },
    [networks.Avalanche]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 90_000
    },
    [networks.BSC]: {
        [SWAP_BAD]: 100_000,
        [SWAP_OK]: 110_000
    },
    [networks.EthereumMainnet]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 100_000
    },
    [networks.Goerli]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 90_000
    },
    [networks.Optimism]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 90_000
    },
    [networks.Polygon]: {
        [SWAP_BAD]: 80_000,
        [SWAP_OK]: 90_000
    }
}
module.exports = {
    adjustments
}