//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./ConfigurableDexible.sol";
import "./IDexible.sol";
import "../libraries/LibStorage.sol";
import "./extensions/SwapExtension.sol";
import "../token/IDXBL.sol";

/**
 * Dexible is the core contract used by the protocol to execution various actions. Swapping,
 * heding, staking, etc. are all handled through the Dexible contract. The contract is also
 * coupled to the RevshareVault in that only this contract can request that tokens be rewarded
 * to users.
 */
contract Dexible is ConfigurableDexible, IDexible {

    //used for trycatch calls
    modifier onlySelf() {
        require(msg.sender == address(this), "Internal call only");
        _;
    }
    using SwapExtension for SwapTypes.SwapRequest;
    using SafeERC20 for IERC20;

    /**
     * NOTE: These gas settings are used to estmate the total gas being used
     * to execute a transaction. Because solidity provides no way to determine
     * the actual gas used until the txn is mined, we have to add buffer gas 
     * amount to account for post-gas-fee computation logic.
     */

    //gas that was used just to load this contract, etc.
    uint constant PRE_OP_GAS = 40_000;

    //final computation needed to compute and transfer gas fees
    uint constant POST_OP_GAS = 60_000;

    //final transfer and events for relay payment
    uint constant RELAY_OP_GAS = 21_000;

    //special case for Arbitrum network where L1 gas fee is not included in 
    //the gas usage
    uint16 constant ARBITRUM = 42161;
    
    //in-memory structure to keep track of execution state
    struct Payments {
        bool feeIsInput;
        bool isSelfSwap;
        uint startGas;
        uint toProtocol;
        uint toRevshare;
        uint outToTrader;
        uint outAmount;
        uint bpsAmount;
        uint gasAmount;
        uint preDXBLBalance;
        uint remainingInBalance;
    }

    /**
     * Initialize Dexible with config settings. This can only be called once after
     * deployment.
     */
    function initialize(LibDexible.DexibleConfig calldata config) public {
        //initialize dexible storage settings
        LibDexible.initialize(LibStorage.getDexibleStorage(), config);

        //initialize key roles
        LibRoleManagement.initializeRoles(LibStorage.getRoleStorage(), config.roleManager);

        //initialize multi-sig settings
        super.initializeMSConfigurable(config.multiSigConfig);
    }

    /**
     * Set the treasury to send share of revenue and gas fees after approval and timeout
     */
    function setTreasury(address t) external override afterApproval(this.setTreasury.selector) {
        LibDexible.DexibleStorage storage ds = LibStorage.getDexibleStorage();
        require(t != address(0), "Invalid treasury address");
        ds.treasury = t;
    }

    /**
     * Main swap function that is only callable by Dexible relays. This version of swap 
     * accounts for affiliate rewards and discounts.
     */
    function swap(SwapTypes.SwapRequest calldata request) external onlyRelay notPaused {
        //console.log("----------------------------- START SWAP ------------------------");

        //compute how much gas we have at the outset, plus some gas for loading contract, etc.
        uint startGas = gasleft() + PRE_OP_GAS;
        
        //get the current DXBL balance at the start to apply discounts
        uint preDXBL = LibStorage.getDexibleStorage().dxblToken.balanceOf(request.executionRequest.requester);
        
        //flag whether the input token is the fee token
        bool feeIsInput = address(request.tokenIn.token) == address(request.executionRequest.fee.feeToken);
        if(feeIsInput) {
            //if it is make sure it doesn't match the first router input amount to account for fees.
            require(request.tokenIn.amount > request.routes[0].routeAmount.amount, "Input fee token amount does not account for fees");
        }

        //get the starting input balance for the input token so we know how much was spent for the swap
        uint startInBal = request.tokenIn.token.balanceOf(address(this));
        
        bool success = false;
        uint outAmount = 0;
        //execute the swap but catch any problem
        try this._trySwap{
            gas: gasleft() - POST_OP_GAS
        }(request) returns (uint out) {
            outAmount = out;
            success = true;
        } catch Error(string memory err) {
            console.log("Error thrown", err);
            success = false;
            outAmount = 0;
            console.log("FailReason", err);
        } catch {
            console.log("Unknown problem occurred");
            success = false;
            outAmount = 0;
        }

        //get post-swap balance so we know how much refund if we didn't spend all
        uint cBal = request.tokenIn.token.balanceOf(address(this));

        //deliberately setting remaining balance to 0 if less amount than current balance.
        //this will force an underflow exception if we attempt to deduct more fees than
        //remaining balance
        uint remainingInBalance = cBal > startInBal ? cBal - startInBal : 0;
        
        //cache information about the swap
        Payments memory payments = Payments({
            feeIsInput: feeIsInput,
            isSelfSwap: false,
            startGas: startGas,
            bpsAmount: 0,
            gasAmount: 0,
            toProtocol: 0,
            toRevshare: 0,
            outToTrader: 0,
            preDXBLBalance: preDXBL,
            outAmount: outAmount,
            remainingInBalance: remainingInBalance
        });


        uint totalGasUsed = 0;
        if(success) {
            //if we succeeded, then do successful post-swap ops
          totalGasUsed = _handleSwapSuccess(request, payments); 
        }  else {
            //otherwise, handle as a failure
            totalGasUsed =(startGas - gasleft())+ POST_OP_GAS;
            _handleSwapFailure(request, feeIsInput, totalGasUsed);
        }

        if(totalGasUsed == 0) {
            totalGasUsed = (startGas - gasleft()) + RELAY_OP_GAS;
        }

        //console.log("Total gas use for relay payment", totalGasUsed);
        //pay the relayer their gas fee if we have funds for it
        _payRelayGas(totalGasUsed);
        
        //console.log("----------------------------- END SWAP ------------------------");
        
    }

    /**
     * This version of swap can be called by anyone. The caller becomes the trader
     * and they pay all gas fees themselves. This is needed to prevent sybil attacks
     * where traders can provide their own affiliate address and get discounts.
     */
    function selfSwap(SwapTypes.SelfSwap calldata request) public notPaused {
        //we create a swap request that has no affiliate attached and thus no
        //automatic discount.
        SwapTypes.SwapRequest memory swapReq = SwapTypes.SwapRequest({
            executionRequest: ExecutionTypes.ExecutionRequest({
                fee: ExecutionTypes.FeeDetails({
                    feeToken: request.feeToken,
                    affiliate: address(0),
                    affiliatePortion: 0
                }),
                requester: msg.sender
            }),
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            routes: request.routes
        });
        //then execute the swap
        _selfSwap(swapReq);
    }

    function _trySwap(SwapTypes.SwapRequest memory request) external onlySelf returns (uint) {
        return request.fill();
    }


    /**
     * Execute a swap issued directly from a trader
     */
    function _selfSwap(SwapTypes.SwapRequest memory request) internal {
        //if the fee is input token
        bool feeIsInput = address(request.tokenIn.token) == address(request.executionRequest.fee.feeToken);
        if(feeIsInput) {
            //make sure there is a buffer to account for fees
            require(request.tokenIn.amount > request.routes[0].routeAmount.amount, "Input fee token amount does not account for fees");
        }

        //the starting input token balance to compute any refund
        uint startInBal = request.tokenIn.token.balanceOf(address(this));

        //trader's balance of DXBL pre-trade to establish discounts
        uint preDXBL = LibStorage.getDexibleStorage().dxblToken.balanceOf(request.executionRequest.requester);
        
        //we dont' call swap in trycath because trader is paying gas. If it fails they
        //pay the fees
        uint outAmount = this._trySwap(request);

        //compute how much input token was spent
        //console.log("Swap success", outAmount);
        uint cBal = request.tokenIn.token.balanceOf(address(this));

        //setting remaining bal to 0 ensures that if insufficient buffer was 
        //provided for fees, the txn will revert
        uint remainingInBalance = cBal > startInBal ? cBal - startInBal : 0;

        //reward trader with DXBL tokens
        //console.log("Collecting DXBL tokens");
        _collectDXBL(request, feeIsInput, outAmount);

        //establish cached info for post-trade processing
        Payments memory payments = Payments({
            feeIsInput: feeIsInput,
            isSelfSwap: true,
            startGas: 0,
            gasAmount: 0,
            bpsAmount: 0,
            toProtocol: 0,
            toRevshare: 0,
            outToTrader: 0,
            outAmount: outAmount,
            preDXBLBalance: preDXBL,
            remainingInBalance: remainingInBalance
        });

        //pay revshare pool and treasury
        //console.log("Making payments");
        _payAndDistribute(request, payments);
        //console.log("Swap complete");
    }


    /**
     * When a relay-based swap fails, we need to account for failure gas fees if the input
     * token is the fee token. That's what this function does
     */
    function _handleSwapFailure(SwapTypes.SwapRequest calldata request, bool feeIsInput, uint gasUsed) private {
        //compute fees for failed txn
        
        //trader still owes the gas fees to the treasury/relay even though the swap failed. This is because
        //the trader may have set slippage too low, or other problems thus increasing the chance of failure.
        
        if(feeIsInput) {
            console.log("Transferring partial input token to devteam for failure gas fees");
            //compute gas fee in fee-token units
            uint gasInFeeToken = _computeGasFee(request, gasUsed * tx.gasprice);
            console.log("Failed gas fee", gasInFeeToken);

            //transfer input assets to treasury
            request.executionRequest.fee.feeToken.safeTransferFrom(request.executionRequest.requester, LibStorage.getDexibleStorage().treasury, gasInFeeToken);
            emit SwapFailed(request.executionRequest.requester, request.executionRequest.fee.feeToken, gasInFeeToken);
        } else {
            //otherwise, if not the input token, unfortunately, Dexible treasury eats the cost.
            console.log("Fee token is output; therefore cannot reimburse team for failure gas fees");
            emit SwapFailed(request.executionRequest.requester, request.executionRequest.fee.feeToken, 0);
        }
    }

    /**
     * This is called when a relay-based swap is successful. It basically rewards DXBL tokens
     * to trader and pays appropriate fees.
     */
    function _handleSwapSuccess(SwapTypes.SwapRequest calldata request, 
                Payments memory payments) private returns (uint totalGasUsed) {
        /**
         * on success, we need to divide fees between protocol and revshare
         * - affiliate gets portion of protocol's share
         */
        //console.log("Gross output amount", payments.outAmount);

        //first, make sure enough output was generated
        require(payments.outAmount >= request.tokenOut.amount, "Insufficient output generated");
        
        //reward trader with DXBL tokens
        _collectDXBL(request, payments.feeIsInput, payments.outAmount);

        //pay fees
        _payAndDistribute(request, payments);

        //return gas used for everything so far plus some post-op activity
        return (payments.startGas - gasleft()) + POST_OP_GAS;
    }

    /**
     * Reward DXBL to the trader
     */
    function _collectDXBL(SwapTypes.SwapRequest memory request, bool feeIsInput, uint outAmount) internal {
        uint value = 0;
        if(feeIsInput) {
            //when input, the total input amount is used to determine reward rate
            value = request.tokenIn.amount;
        } else {
            //otherwise, it's the output generated from the swap
            value = outAmount;
        }
        //Dexible is the only one allowed to ask the vault to mint tokens on behalf of a trader
        //See RevshareVault for logic of minting rewards
        IRevshareVault(LibStorage.getDexibleStorage().revshareManager).rewardTrader(request.executionRequest.requester, address(request.executionRequest.fee.feeToken), value);
    }

    /**
     * Distribute payments to revshare pool, affiliates, treasury, and trader
     */
    function _payAndDistribute(SwapTypes.SwapRequest memory request, 
                                Payments memory payments) internal {
        _payRevshareAndAffiliate(request, payments);
        _payProtocolAndTrader(request, payments);
    }

    /**
     * Payout bps portions to revshare pool and affiliate
     */
    function _payRevshareAndAffiliate(SwapTypes.SwapRequest memory request, 
                                Payments memory payments) internal {
        //assume trader gets all output
        payments.outToTrader = payments.outAmount;

        //the bps portion of fee. 
        payments.bpsAmount = _computeBpsFee(request, payments.feeIsInput, payments.preDXBLBalance, payments.outAmount);
    
        //console.log("Total bps fee", payments.bpsAmount);

        //revshare pool gets portion of bps fee collected
        payments.toRevshare = (payments.bpsAmount * LibStorage.getDexibleStorage().revshareSplitRatio) / 100;

        //console.log("To revshare", payments.toRevshare);

        //protocol gets remaining bps but affiliate fees come out of its portion. This could revert if
        //Dexible miscalculated the affiliate reward portion. However, the call would revert here and
        //Dexible relay would pay the gas fee.
        payments.toProtocol = (payments.bpsAmount-payments.toRevshare) - request.executionRequest.fee.affiliatePortion;

        //console.log("Protocol pre-gas", payments.toProtocol);

        //fees accounted for thus far
        uint total = payments.toRevshare + payments.toProtocol + request.executionRequest.fee.affiliatePortion;
            
        if(!payments.feeIsInput) {
            //this is an interim calculation. Gas fees get deducted later as well. This will
            //also revert if insufficient output was generated to cover all fees
            payments.outToTrader = payments.outAmount - total;
        } else {
            //this will revert with error if total is more than we have available
            //forcing caller to pay gas for insufficient buffer in input amount vs. traded amount
            payments.remainingInBalance -= total;
        }

        //now distribute fees
        IERC20 feeToken = request.executionRequest.fee.feeToken;
        //pay revshare their portion
        feeToken.safeTransfer(LibStorage.getDexibleStorage().revshareManager, payments.toRevshare);
        if(request.executionRequest.fee.affiliatePortion > 0) {
            //pay affiliate their portion
            feeToken.safeTransfer(request.executionRequest.fee.affiliate, request.executionRequest.fee.affiliatePortion);
            emit AffiliatePaid(request.executionRequest.fee.affiliate, feeToken, request.executionRequest.fee.affiliatePortion);
        }
    }

    /**
     * Final step to compute gas consumption for trader and pay the protocol and trader 
     * their shares.
     */
    function _payProtocolAndTrader(SwapTypes.SwapRequest memory request,
                            Payments memory payments) internal {
        
        if(!payments.isSelfSwap) {
            //If this was a relay-based swap, we need to pay treasury an estimated gas fee
            uint gasTotal = 0;
            uint cid;
            assembly {
                cid := chainid()
            }
            //we leave unguarded for gas savings since we know start gas is always higher 
            //than used and will never rollover without costing an extremely large amount of $$
            unchecked { 
                //the total gas used thus far plus some post-op stuff that needs to get done
                uint totalGas = (payments.startGas - gasleft()) + POST_OP_GAS;
                if(cid == ARBITRUM) {
                    //arbitrum gas cost must include a portion for L1 submission. We account for it 
                    //with a multiplier.
                    totalGas *= 8;
                }
                console.log("Estimated gas used for trader gas payment", totalGas);
                gasTotal = totalGas * tx.gasprice;
            }

            //use price oracle in vault to get native price in fee token
            payments.gasAmount = _computeGasFee(request, gasTotal);
            console.log("Gas paid by trader", payments.gasAmount);

            //add gas payment to treasury portion
            payments.toProtocol += payments.gasAmount;
            console.log("Payment to protocol", payments.toProtocol);

            if(!payments.feeIsInput) {
                //if output was fee, deduct gas payment from proceeds
                payments.outToTrader -= payments.gasAmount;
            } else {
                //will revert if insufficient remaining balance to cover gas causing caller
                //to pay all gas and get nothing if they don't have sufficient buffer of input vs
                //router input amount
                payments.remainingInBalance -= payments.gasAmount;
            }
            //console.log("Proceeds to trader", payments.outToTrader);
        }

        //now distribute fees
        IERC20 feeToken = request.executionRequest.fee.feeToken;
        feeToken.safeTransfer(LibStorage.getDexibleStorage().treasury, payments.toProtocol);

        //console.log("Sending total output to trader", payments.outToTrader);
        request.tokenOut.token.safeTransfer(request.executionRequest.requester, payments.outToTrader);
        
        //refund any remaining over-estimate of input amount needed
        if(payments.remainingInBalance > 0) {
            //console.log("Total refund to trader", payments.remainingInBalance);
            request.tokenIn.token.safeTransfer(request.executionRequest.requester, payments.remainingInBalance);
        }

        emit SwapSuccess(request.executionRequest.requester,
                    request.executionRequest.fee.affiliate,
                    request.tokenOut.amount,
                    payments.outToTrader, 
                    request.executionRequest.fee.feeToken,
                    payments.gasAmount,
                    request.executionRequest.fee.affiliatePortion,
                    payments.bpsAmount); 
        //console.log("Finished swap");
    }

    /**
     * Compute gas fee in fee-token units. This uses the RevshareVault's access to oracles
     * to determing native gas price relative to fee token price.
     */
    function _computeGasFee(SwapTypes.SwapRequest memory request, uint gasTotal) internal view returns (uint gasFee) {
        LibDexible.DexibleStorage storage ds = LibStorage.getDexibleStorage();
        IRevshareVault vault = IRevshareVault(ds.revshareManager);
        return vault.convertGasToFeeToken(address(request.executionRequest.fee.feeToken), gasTotal);
    }

    /**
     * Compute the bps to charge for the swap. This leverages the DXBL token to compute discounts
     * based on trader balances and discount rates applied per DXBL token.
     */
    function _computeBpsFee(SwapTypes.SwapRequest memory request, bool feeIsInput, uint preDXBL, uint outAmount) internal view returns (uint) {
        //apply any discounts
        LibDexible.DexibleStorage storage ds = LibStorage.getDexibleStorage();
        
        return ds.dxblToken.computeDiscountedFee(
            IDXBL.FeeRequest({
                trader: request.executionRequest.requester,
                amt: feeIsInput ? request.tokenIn.amount : outAmount,
                referred: request.executionRequest.fee.affiliate != address(0),
                dxblBalance: preDXBL,
                stdBpsRate: ds.stdBpsRate,
                minBpsRate: ds.minBpsRate
            }));
    }

    /**
     * Pay the relay with gas funds stored in this contract. The gas used provided 
     * does not include arbitrum multiplier but may include additional amount for post-op
     * gas estimates.
     */
    function _payRelayGas(uint totalGasUsed) internal {
        
        uint256 gasFee = totalGasUsed * tx.gasprice;
        uint cid;
        assembly {
            cid := chainid()
        }
        if(cid == ARBITRUM) {
            //arbitrum gas cost includes a portion for L1 submission. We account for it 
            //with a multiplier.
            gasFee *= 8;
        }
        console.log("Relay Gas Reimbursement", gasFee);
        //if there is ETH in the contract, reimburse the relay that called the fill function
        if(address(this).balance < gasFee) {
            console.log("Cannot reimburse relay since do not have enough funds");
            emit InsufficientGasFunds(msg.sender, gasFee);
        } else {
            console.log("Transfering gas fee to relay");
            payable(msg.sender).transfer(gasFee);
            emit PaidGasFunds(msg.sender, gasFee);
        }
    }
}