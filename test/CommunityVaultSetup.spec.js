const {deployAll} = require("../src/deployAll");
const {feeTokens} = require("../src/feeTokens");
const {mintRates} = require("../src/vaultSteps/mintRates");
const { ethers } = require("hardhat");

const NET = 1;
const DAY = 86400;

let timestamp = Math.floor(Date.now()/1000);


describe("CommunityVault", function() {
    this.timeout(60000);
    let props = {
        chainId: NET
    };

    const advanceTime = async (time) => {
        await ethers.provider.send("evm_mine", [time]);
    }

    const decodeLogs = async (logs) => {
        const _logs = {};
        const {communityVault} = props;
        for(let i=0;i<logs.length;++i) {
            if(logs[i].address === communityVault.address) {
                const l = await communityVault.interface.parseLog(logs[i]);
                const list = _logs[l.name] || [];
                list.push(l);
                _logs[l.name] = list;
            }
        }
        return _logs;
    }
    
    before(async function() {
        const signers = await hre.ethers.getSigners();
        const accts = hre.network.config.accounts;
        const m = accts.mnemonic;
        const p = `${accts.path}/${signers.length-1}`;
        const mSig = signers[signers.length-1];
        const w = ethers.Wallet.fromMnemonic(m, p);
        mSig.privateKey = w.privateKey.substring(2);
        
        props = await deployAll({
            isTest: true,
            timelock: 1,
            forceDeploy: true,
            adminMultiSig: mSig
        });
    });

    it("Should successfully migrate", async () => {
        
        const {communityVault, adminMultiSig, mockMigration} = props;
        await communityVault.connect(adminMultiSig).scheduleMigration(mockMigration.address);
       
        while(true) {
            await advanceTime(timestamp + 5);
            timestamp += 5;
            try {
                const go = await communityVault.canMigrate();
                if(go) {
                    break;
                }
            } catch (error) {
                console.log(error);
            }
        }
        const txn = await communityVault.connect(adminMultiSig).migrateV1();
        const r = await txn.wait();
        const logs = await decodeLogs(r.logs);
        console.log("Cost", r.gasUsed);

        if(!logs.VaultMigrated || logs.VaultMigrated.length === 0) {
            throw new Error("Migration event not emitted");
        }
    });
});