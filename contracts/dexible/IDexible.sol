//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "../common/SwapTypes.sol";

interface IDexible {

    event SwapFailed(address indexed trader, 
                     IERC20 feeToken, 
                     uint gasFeePaid);
    event SwapSuccess(address indexed trader,
                        address indexed affiliate,
                        uint inputAmount,
                        uint outputAmount,
                        IERC20 feeToken,
                        uint gasFee,
                        uint affiliateFee,
                        uint dexibleFee);
    event PaidGasFunds(address indexed relay, uint amount);
    event InsufficientGasFunds(address indexed relay, uint amount);
    event AffiliatePaid(address indexed affiliate, IERC20 token, uint amount);

    function setTreasury(address t) external;
    function swap(SwapTypes.SwapRequest calldata request) external;
    
}