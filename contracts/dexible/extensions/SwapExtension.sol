//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;


import "../../libraries/LibStorage.sol";
import "../../common/SwapTypes.sol";
import "../../common/LibConstants.sol";
import "../../revshare/IRevshareVault.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "hardhat/console.sol";

/**
 * Dexible will eventually support multiple types of executions. The swap logic is handled 
 * by this extension library that handles checking for swap details and calling routers
 * with specified input.
 */
library SwapExtension {
    using SafeERC20 for IERC20;

    function fill(SwapTypes.SwapRequest calldata request) public returns (uint outAmount) {
        _preCheck(request);
        outAmount = trySwap(request, request.tokenOut.token.balanceOf(address(this)));
    }

    function trySwap(SwapTypes.SwapRequest calldata request, uint startBal) internal returns (uint) {
        _preFill(request);

        for(uint i=0;i<request.routes.length;++i) {
            SwapTypes.RouterRequest calldata rr = request.routes[i];
            IERC20(rr.routeAmount.token).safeApprove(rr.spender, rr.routeAmount.amount);
            (bool s, ) = rr.router.call(rr.routerData);

            if(!s) {
                revert("Failed to swap");
            }
        }

        return request.tokenOut.token.balanceOf(address(this)) - startBal;
    }

    function _preCheck(SwapTypes.SwapRequest calldata request) private view {
        //make sure fee token is allowed
        address fToken = address(request.executionRequest.fee.feeToken);
        bool ok = IRevshareVault(LibStorage.getDexibleStorage()
                .revshareManager).isFeeTokenAllowed(fToken);
        require(
            ok, 
            "Fee token is not allowed"
        );

        //and that it's one of the tokens swapped
        require(fToken == address(request.tokenIn.token) ||
                fToken == address(request.tokenOut.token), 
                "Fee token must be input or output token");
    }

    function _preFill(SwapTypes.SwapRequest calldata request) private {
        //transfer input tokens to router so it can perform dex trades
        console.log("Transfering input for trading:", request.tokenIn.amount);
        //we transfer the entire input, not the router-only inputs. This is to 
        //save gas on individual transfers. Any unused portion of input is returned 
        //to the trader in the end.
        request.tokenIn.token.safeTransferFrom(request.executionRequest.requester, address(this), request.tokenIn.amount);
        console.log("Expected output", request.tokenOut.amount);
    }
    
}