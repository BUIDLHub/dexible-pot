//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

interface IArbGasInfo {
    function getPricesInWei() external view returns (uint, uint, uint, uint, uint, uint);
    function getCurrentTxL1GasFees() external returns (uint);
    function getL1GasPriceEstimate() external returns (uint);
}