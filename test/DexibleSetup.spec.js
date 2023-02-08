const { ethers } = require("hardhat");
const {deployAll} = require("../src/deployAll");

const NET = 42161;
const DAY = 86400;
const HR = DAY / 24;
const USD_PRECISION = 6;
const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

let timestamp = Math.floor(Date.now()/1000);

const advanceTime = async (time) => {
    await ethers.provider.send("evm_mine", [time]);
}


describe("DexibleSetup", function (){
    this.timeout(60000);

    let props = {
        chainId: NET
    };

    before(async function() {
        const signers = await hre.ethers.getSigners();
        const accts = hre.network.config.accounts;
        const m = accts.mnemonic;
        const p = `${accts.path}/${signers.length-1}`;
        const mSig = signers[signers.length-1];
        const w = ethers.Wallet.fromMnemonic(m, p);
        mSig.privateKey = w.privateKey.substring(2);
        props = await deployAll({
            timelock: 1,
            forceDeploy: true,
            adminMultiSig: mSig
        });
    });


    const _testChange = async (testDetails) => {
        const { expEvent, actualCall} = testDetails;
        
        const {wallets, adminMultiSig, dexible} = props;
        
        if(!adminMultiSig || !wallets.dexibleAdmin) {
            throw new Error("Missing signers for testing");
        }
        let fail = false;
        try {
            await actualCall(dexible.connect(wallets.dexibleAdmin));
        } catch (e) {
            fail = true;
        }
        if(!fail) {
            throw new Error("Expected to fail when not called by multisig");
        }

        let txn = await actualCall(dexible.connect(adminMultiSig));
        let r = await txn.wait();

        const decodeLogs = async (logs) => {
            const _logs = {};

            for(let i=0;i<r.logs.length;++i) {
                if(r.logs[i].address === dexible.address) {
                    const l = await dexible.interface.parseLog(r.logs[i]);
                    const list = _logs[l.name] || [];
                    list.push(l);
                    _logs[l.name] = list;
                }
            }
            return _logs;
        }
        let logs = await decodeLogs(r.logs);
        if(!logs[expEvent] || logs[expEvent].length === 0) {
            throw new Error(`Expected event ${expEvent}`);
        }
    };

    it("Should deploy and setup vault and dexible swap", async () => {
        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }
    })

    it("Should set new std bps rates after approval", async () => {
        const {dexible} = props;
        await _testChange({
            fnDef: "setStdBpsRate(uint16)",
            data: [10],
            expEvent: "StdBpsChanged",
            actualCall: async (d) => d.setStdBpsRate(10)
        });
        const rate = await dexible.stdBpsRate();
        if(+rate.toString() != 10) {
            throw new Error("Expected stdBps to change: " + rate.toString());
        }
    });

    it("Should set new min bps rates after approval", async () => {
        const {dexible} = props;
        await _testChange({
            fnDef: "setMinBpsRate(uint16)",
            data: [5],
            expEvent: "MinBpsChanged",
            actualCall: async (d) => d.setMinBpsRate(5)
        });
        const rate = await dexible.minBpsRate();
        if(+rate.toString() != 5) {
            throw new Error("Expected minBps to change: " + rate.toString());
        }
    });

    it("Should change community vault contract", async () => {
        const {dexible, dxblToken} = props;
        await _testChange({
            fnDef: "setCommunityVault(address)",
            data: [dxblToken.address],
            expEvent: "VaultChanged",
            actualCall: async (d) => d.setCommunityVault(dxblToken.address)
        });
        const rs = await dexible.communityVault();
        if(rs !== dxblToken.address) {
            throw new Error("Expected to change vault address");
        }
    });

    it("Should change revshare split", async () => {
        const {dexible} = props;
        await _testChange({
            fnDef: "setRevshareSplitRatio(uint8)",
            data: [40],
            expEvent: "SplitRatioChanged",
            actualCall: async (d) => d.setRevshareSplitRatio(40)
        });
        const split = await dexible.revshareSplitRatio();
        if(split != 40) {
            throw new Error("Expected split to be 40: " + split);
        }
    })



    

});