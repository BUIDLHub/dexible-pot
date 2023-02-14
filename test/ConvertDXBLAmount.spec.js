const { ethers } = require("hardhat")

const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

const precision = inUnits("1", 18);
describe("ConvertDXBL", function() {

    it("Should convert DXBL burn based on reward token balance", async () => {
        //router in
        //326861425241615517
        //token in
        //328000000000000000
        const est = ethers.BigNumber.from("10399725075164");
        const rewardBal = ethers.BigNumber.from("10400000000000");
        console.log("Reward estimate", inDecs(est, 18));

        const bal = ethers.BigNumber.from("387940707707553210");
        console.log("Balance", inDecs(bal, 18));

        const rate = est.mul(precision).div(bal);
        const burnRate = rewardBal.mul(precision).div(rate);
        console.log("RATE", inDecs(rate, 18));
        console.log("BURN", inDecs(burnRate, 18));

    })
})