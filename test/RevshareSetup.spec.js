const {deployRevshare} = require("../src/deployRevshare");
const {feeTokens} = require("../src/revshareSteps/feeTokens");
const {mintRates} = require("../src/revshareSteps/mintRates");
const { ethers } = require("hardhat");
const {asToken: asUSDCToken, asTokenContract: asUSDCContract, setBalance : setUSDCBalance} = require("./setup/USDC");

const NET = 1;
const DAY = 86400;
const HR = DAY / 24;
const USD_PRECISION = 6;
const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

let timestamp = Math.floor(Date.now()/1000);

//arbitrum
const USDT = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
const USDT_FEED = "0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7";

const sleep = ms => new Promise(done => setTimeout(done, ms));

describe("RevshareVault", function() {
    this.timeout(60000);
    let props = {};

    const setupVault = async () => {
        const {dxblToken, wallets, revshareVault} = props;
        if(!dxblToken || !revshareVault) {
            throw new Error("Missing token or vault in deployment");
        }
        console.log("Setting up vault");
        await revshareVault.connect(wallets.dexibleAdmin).setDXBL(dxblToken.address);
        await revshareVault.connect(wallets.dexibleAdmin).setDexible(wallets.dexibleAdmin.address);
    }

    const advanceTime = async (time) => {
        await ethers.provider.send("evm_mine", [time]);
    }

    
    before(async function() {
        props = await deployRevshare({
            timelock: 1,
            forceDeploy: true
        });
        await setupVault();
    });

    it("Should approve bps change", async () => {
        const bpsBefore = await props.revshareVault.discountBps();
        await _testChange({
            fnDef: 'setDiscountRateBps(uint32)', 
            data: [4],
            expEvent: "DiscountChanged",
            actualCall: async (revshareVault) => revshareVault.setDiscountRateBps(4)
        });
        const bps = await props.revshareVault.discountBps();
        if(bps == bpsBefore) {
            throw new Error("Expected bps rate to change");
        }
    });

    it("Should change fee tokens", async () => {

        const details = feeTokens[NET];
        const tokens = [];
        const priceFeeds = [];
        details.forEach(d => {
            tokens.push(d.token);
            priceFeeds.push(d.feed);
        });
        const config = {
            feeTokens: tokens,
            priceFeeds
        };

        await _testChange({
            fnDef: 'setFeeTokens((address[],address[]))',
            data: [config],
            expEvent: 'FeeTokenAdded',
            actualCall: async (vault) => vault.setFeeTokens(config)
        });
    });

    it("Should set mint rates", async () => {
        await _testChange({
            fnDef: "setMintRates((uint16,uint16,uint)[])",
            data: [mintRates],
            expEvent: 'MintRateChange',
            actualCall: async (vault) => vault.setMintRates(mintRates)
        });
    })

    const _testChange = async (testDetails) => {
        const {fnDef, data, expEvent, actualCall} = testDetails;
        
        const {wallets, revshareVault} = props;
        const approver1 = wallets.dexibleAdmin;
        const approver2 = wallets.all[wallets.all.length-2];
        const enc = revshareVault.interface.encodeFunctionData(fnDef, data);
        let txn = await revshareVault.connect(approver1).requestChange(enc);
        let r = await txn.wait();

        const decodeLogs = async (logs) => {
            const _logs = {};

            for(let i=0;i<r.logs.length;++i) {
                if(r.logs[i].address === revshareVault.address) {
                    const l = await revshareVault.interface.parseLog(r.logs[i]);
                    const list = _logs[l.name] || [];
                    list.push(l);
                    _logs[l.name] = list;
                }
            }
            return _logs;
        }
        let logs = await decodeLogs(r.logs);

        let fail = false;
        try {
            //this should not work
            await actualCall(revshareVault.connect(approver1));
            fail = true;
        } catch (e) {
            console.log(e.message);
        }
        if(fail) {
            throw new Error("Expected to fail w/out prior approval");
        }
        const cr = logs.ChangeRequested[0];
        
        const hash = cr.args.sigHash;
        const nonce = +cr.args.nonce.toString();

        while(true) {
            await advanceTime(timestamp + 5);
            timestamp += 5;
            try {
                await revshareVault.canApplyChange(nonce);
                break;
            } catch (error) {
                console.log(error);
            }
            
        }
        //ARRAYIFY is import so that ethers treats message as bytes and properly applies
        //hash to bytes plus eth prefix
        let msg = ethers.utils.arrayify(hash);
        const sig = approver2.signMessage(msg);
        txn = await revshareVault.connect(approver1).delegatedApproveChange(nonce, approver2.address, sig);
        r = await txn.wait();
        
        logs = await decodeLogs(r.logs);
        if(!logs[expEvent] || logs[expEvent].length === 0) {
            throw new Error(`Expected event ${expEvent}`);
        }
        //should fail again
        fail = false;
        try {
            //this should not work now that it's been executed
            await actualCall(revshareVault.connect(approver1));
            fail = true;
        } catch (e) {  }
        if(fail) {
            throw new Error("Expected to fail w/out prior approval");
        }

    };
});