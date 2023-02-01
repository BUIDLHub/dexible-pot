//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./DexibleRoleManagement.sol";
import "../common/MultiSigConfigurable.sol";

/**
 * Base contract to add configuration options for Dexible contract. All config settings
 * require multi-sigs since we extend the MultiSigConfigurable contract. 
 */
abstract contract ConfigurableDexible is MultiSigConfigurable, DexibleRoleManagement {

    using LibDexible for LibDexible.DexibleStorage;
    event ChangedRevshareVault(address indexed old, address indexed newRevshare);
    event ChangedRevshareSplit(uint8 split);
    event ChangedBpsRates(uint32 stdRate, uint32 minRate);
    

    /**
     * Get the current BPS fee rates
     */
    function bpsRates() public view returns (LibDexible.BpsFeeChange memory) {
        return LibDexible.BpsFeeChange({
            stdBps: LibStorage.getDexibleStorage().stdBpsRate,
            minBps: LibStorage.getDexibleStorage().minBpsRate
        });
    }

    /**
     * Set a new bps rate after approval and timelock
     */
    function setNewBps(LibDexible.BpsFeeChange calldata changes) public afterApproval(this.setNewBps.selector) {
        LibStorage.getDexibleStorage().setNewBps(changes);
    }

    /**
     * Get the address for the RevshareVault
     */
    function revshareVault() public view returns (address) {
        return LibStorage.getDexibleStorage().revshareManager;
    }

    /**
     * Set the address of the revshare vault after approval and timelock
     */
    function setRevshareVault(address t) public afterApproval(this.setRevshareVault.selector) {
        LibStorage.getDexibleStorage().setRevshareVault(t);
    }

    /**
     * Get the amount of BPS fee going to the RevshareVault (expressed as whole percentage i.e. 50 = 50%)
     */
    function revshareSplit() public view returns (uint8) {
        return LibStorage.getDexibleStorage().revshareSplitRatio;
    }

    /**
     * Set the revshare split percentage after approval and timelock
     */
    function setRevshareSplit(uint8 split) public afterApproval(this.setRevshareSplit.selector) {
        LibStorage.getDexibleStorage().setRevshareSplit(split);
    }
}