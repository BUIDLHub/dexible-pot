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

    let props = {};

    before(async function() {
        props = await deployAll({
            timelock: 1,
            forceDeploy: true
        });
    });


    const _testChange = async (testDetails) => {
        const {fnDef, data, expEvent, actualCall} = testDetails;
        
        const {wallets, dexible} = props;
        const approver1 = wallets.dexibleAdmin;
        const approver2 = wallets.all[wallets.all.length-2];
        const enc = dexible.interface.encodeFunctionData(fnDef, data);
        let txn = await dexible.connect(approver1).requestChange(enc);
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
        
        let fail = false;
        try {
            //this should not work
            await actualCall(dexible.connect(approver1));
            fail = true;
        } catch (e) { }
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
                await dexible.canApplyChange(nonce);
                break;
            } catch (error) {
                console.log(error);
            }
            
        }
        //ARRAYIFY is import so that ethers treats message as bytes and properly applies
        //hash to bytes plus eth prefix
        let msg = ethers.utils.arrayify(hash);
        const sig = approver2.signMessage(msg);
        txn = await dexible.connect(approver1).delegatedApproveChange(nonce, approver2.address, sig);
        r = await txn.wait();
        
        logs = await decodeLogs(r.logs);
        if(!logs[expEvent] || logs[expEvent].length === 0) {
            throw new Error(`Expected event ${expEvent}`);
        }

        //should fail again
        fail = false;
        try {
            //this should not work now that it's been executed
            await actualCall(dexible.connect(approver1));
            fail = true;
        } catch (e) {  }
        if(fail) {
            throw new Error("Expected to fail w/out prior approval");
        }
    };

    it("Should deploy and setup vault and dexible swap", async () => {
        if(!props.dexible) {
            throw new Error("Missing Dexible in context");
        }
    })

    it("Should set new bps rates after approval", async () => {
        const {dexible} = props;
        await _testChange({
            fnDef: "setNewBps((uint16,uint16))",
            data: [{stdBps: 10, minBps: 4}],
            expEvent: "ChangedBpsRates",
            actualCall: async (dexible) => dexible.setNewBps({stdBps: 10, minBps: 4}),
        });
        const rates = await dexible.bpsRates();
        if(+rates.stdBps.toString() != 10) {
            throw new Error("Expected stdBps to change: " + rates.stdBps.toString());
        }
    });

    it("Should change revshare contract", async () => {
        const {dexible, dxblToken} = props;
        await _testChange({
            fnDef: "setRevshareVault(address)",
            data: [dxblToken.address],
            expEvent: "ChangedRevshareVault",
            actualCall: async (dexible) => dexible.setRevshareVault(dxblToken.address)
        });
        const rs = await dexible.revshareVault();
        if(rs !== dxblToken.address) {
            throw new Error("Expected to change revshare vault address");
        }
    });

    it("Should change revshare split", async () => {
        const {dexible} = props;
        await _testChange({
            fnDef: "setRevshareSplit(uint8)",
            data: [40],
            expEvent: "ChangedRevshareSplit",
            actualCall: async (dexible) => dexible.setRevshareSplit(40)
        });
        const split = await dexible.revshareSplit();
        if(split != 40) {
            throw new Error("Expected split to be 40: " + split);
        }
    })



    

});