//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "../libraries/LibStorage.sol";
import "../libraries/LibRoleManagement.sol";
import "../common/LibConstants.sol";
import "../common/MultiSigConfigurable.sol";
import "hardhat/console.sol";

/**
 * Role management base contract that manages certain key roles for Dexible contract.
 */
abstract contract DexibleRoleManagement is MultiSigConfigurable {

    //emitted when role is added
    event RoleSet(address indexed member, string role);

    //emitted when role revoked
    event RoleRevoked(address indexed member, string role);

    using LibRoleManagement for LibRoleManagement.RoleStorage;

    modifier onlyRelay() {
        require(LibStorage.getRoleStorage().hasRole(msg.sender, LibConstants.RELAY), "Unauthorized relay");
        _;
    }

    function addRelay(address relay) public afterApproval(this.addRelay.selector) {
        LibStorage.getRoleStorage().setRole(relay, LibConstants.RELAY);
    }

    function addRelays(address[] calldata relays) public afterApproval(this.addRelays.selector) {
        LibRoleManagement.RoleStorage storage rs = LibStorage.getRoleStorage();
        for(uint i=0;i<relays.length;++i) {
            rs.setRole(relays[i], LibConstants.RELAY);
        }
    }

    function removeRelay(address relay) public onlyApprover {
        removeRole(relay, LibConstants.RELAY);
    }

    function isRelay(address relay) public view returns(bool) {
        return hasRole(relay, LibConstants.RELAY);
    }

    function setRole(address member, string memory role) public afterApproval(this.setRole.selector) {
         LibStorage.getRoleStorage().setRole(member, role);
    }

    function setRoles(address member, string[] calldata roles) public afterApproval(this.setRoles.selector) {
         LibStorage.getRoleStorage().setRoles(member, roles);
    }

    function removeRole(address member, string memory role) public onlyApprover {
         LibStorage.getRoleStorage().removeRole(member, role);
    }

    function removeRoles(address member, string[] calldata roles) public onlyApprover {
         LibStorage.getRoleStorage().removeRoles(member, roles);
    }

    function hasRole(address member, string memory role) public view returns (bool) {
        return  LibStorage.getRoleStorage().hasRole(member, role);
    }
}