//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "../V1Migrateable.sol";
import "hardhat/console.sol";

contract MockMigration is V1MigrationTarget {

    event Migrated();
    function migrationFromV1(VaultStorage.VaultMigrationV1 memory data) external {
        console.log("Migrated from V1");
        emit Migrated();
    }
}