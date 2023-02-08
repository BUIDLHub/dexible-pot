//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "./LibDexible.sol";
import "../dexible/oracle/IOptimismGasOracle.sol";

library LibGas {
    //special handling for L2s that impose an L1 rollup fee
    uint constant ARB = 42161;
    uint constant OPT = 10;
    IOptimismGasOracle constant optGasOracle = IOptimismGasOracle(0x420000000000000000000000000000000000000F);

    function computeGasCost(LibDexible.DexibleStorage storage ds, uint gasUsed) public view returns(uint) {
         uint cid;
        assembly {
            cid := chainid()
        }
        if(cid == ARB) {
            return ds.arbitrumGasOracle.calculateGasCost(msg.data.length, gasUsed);
        }
        if(cid == OPT) {
            return (tx.gasprice * gasUsed) + optGasOracle.getL1Fee(msg.data);
        }
        return tx.gasprice * gasUsed;
    }

}