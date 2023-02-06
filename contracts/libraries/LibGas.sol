//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./LibDexible.sol";

library LibGas {
    //special handling for L2s that impose an L1 rollup fee
    uint constant ARB = 42161;
    uint constant OPT = 10;

    function computeGasCost(LibDexible.DexibleStorage storage ds, uint gasUsed) public view returns(uint) {
         uint cid;
        assembly {
            cid := chainid()
        }
        if(cid != ARB) {
            return tx.gasprice * gasUsed;
        }
        
        return ds.arbitrumGasOracle.calculateGasCost(msg.data.length, gasUsed);
    }

}