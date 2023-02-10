const {feeTokens} = require("../src/feeTokens");
const {mintRates} = require("../src/vaultSteps/mintRates");
const { ethers } = require("hardhat");
const {asToken: asUSDCToken, asTokenContract: asUSDCContract, setBalance : setUSDCBalance} = require("./setup/USDC");
const {USD_PRECISION} = require('../src/constants');
const {deployAll} = require('../src/deployAll');

const NET = 1;
const DAY = 86400;
const HR = DAY / 24;
const inUnits = ethers.utils.parseUnits;
const inDecs = ethers.utils.formatUnits;

let timestamp = Math.floor(Date.now()/1000);

const bn = ethers.BigNumber.from;
const sleep = ms => new Promise(done => setTimeout(done, ms));

describe("communityVault", function() {
    this.timeout(60000);
    let props = {
        chainId: NET
    };


    const advanceTime = async (time) => {
        await ethers.provider.send("evm_mine", [time]);
    }

    const simulateTrade = async({
        usdcAmount,
        timestamp,
        burnPerc
    }) => {

        const {dxblToken, communityVault, wallets} = props;
        const trader = wallets.all[2];
        const feeToken = feeTokens[NET][0];
        const inAmount = inUnits(usdcAmount.toFixed(6), 6);
        
        const usdcCon = asUSDCContract(ethers.provider, NET);
        const cBal = +inDecs(await usdcCon.balanceOf(communityVault.address), 6);
        console.log("Setting USDC balance for vault starting at", cBal);
        await setUSDCBalance({
            ethers,
            provider: ethers.provider,
            chain: NET,
            tgtAddress: communityVault.address,
            balance: cBal + (usdcAmount*(4/10000))
        });

        console.log("Rewarding trader with volume: " + usdcAmount);
        let txn = await communityVault.connect(wallets.dexibleAdmin).rewardTrader(trader.address, feeToken.token, inAmount);
        let r = await txn.wait();
        console.log("GAS USED", r.gasUsed.toString());

        

        if(burnPerc) {
            const traderBal = await dxblToken.balanceOf(trader.address);
            const burnAmt = traderBal.mul(burnPerc).div(100);
            const estOut = await props.communityVault.estimateRedemption(feeTokens[NET][0].token, burnAmt);
        
            console.log("Will burn", inDecs(burnAmt, 18), `(${burnPerc}%) for`, estOut);
            txn = await communityVault.connect(trader).redeemDXBL(feeTokens[NET][0].token, burnAmt, bn(estOut).mul(999).div(10000), false);
            r = await txn.wait();
            console.log("BURN GAS", r.gasUsed.toString());
        }

        console.log("Advancing clock", timestamp);
        await advanceTime(timestamp);
    }
    
    before(async function() {
        props = await deployAll({
            timelock: 1,
            forceDeploy: true,
            mockDexibleContract: true
        });
    });

    
    it("Should mint tokens to trader", async () => {
        if(!props.communityVault) {
            throw new Error("Missing vault");
        }
        const {dxblToken, communityVault, wallets} = props;

            
        const trader = wallets.all[2];
        timestamp += 5;
        await simulateTrade({
            usdcAmount: 1000,
            timestamp
        });

        //starting rate is $100 in volume per token. Should have almost 10 tokens
        const bal = await dxblToken.balanceOf(trader.address);
        const low = inUnits("9", 18);
        const hi = inUnits("11", 18);
        if(bal.gt(hi) || bal.lt(low)) {
            throw new Error("Expected DXBLs to be between 9-10: " + inDecs(bal,18));
        }

        const rate = await communityVault.currentMintRateUSD();
        const usd = inDecs(rate, USD_PRECISION);
        if(+usd !== 100) {
            throw new Error("Expected mint rate to still be 100");
        }
    });

    it("Should mint tokens at lower rate once exceeded bounds", async () => {
        if(!props.communityVault) {
            throw new Error("Missing vault");
        }
        const {dxblToken, communityVault, wallets} = props;

        const trader = wallets.all[2];
        const feeToken = feeTokens[NET][0];
        const amt = 2_000_000;
        
       timestamp += 5;
       await simulateTrade({
        usdcAmount: amt,
        timestamp
       });
       
        const mintRate = +(inDecs(await communityVault.currentMintRateUSD(), USD_PRECISION));
        const expTokens = inUnits(Math.floor(amt / mintRate).toFixed(18), 18);

       //starting rate is $100 in volume per token. Should have almost 10 tokens
        const bal = await dxblToken.balanceOf(trader.address);

        if(bal.lt(expTokens) ) {
            throw new Error(`Expected DXBLs to be at least ${inDecs(expTokens, 18)}: ${inDecs(bal,18)}`);
        }

        const rate = await communityVault.currentMintRateUSD();
        const usd = inDecs(rate, USD_PRECISION);
        if(usd <= 100) {
            throw new Error("Mint rate should be more than 100");
        }
    });

    it("Should redeem DXBL for USDC", async () => {
        if(!props.communityVault) {
            throw new Error("Missing vault");
        }
        const {dxblToken, communityVault, wallets} = props;

        const trader = wallets.all[2];
        const nav = await communityVault.currentNavUSD();
        if(nav.eq(0)) {
            throw new Error("Nav should not be 0");
        }
        let usdNav = +inDecs(nav, USD_PRECISION);
        let bal = +inDecs(await dxblToken.balanceOf(trader.address), 18);
        console.log("Pre-Nav:", usdNav, "Pre-Bal", bal);
        const burn = 1000;
        const estOut = await props.communityVault.estimateRedemption(feeTokens[NET][0].token, inUnits(bal.toString(), 18));
        console.log("Est out", estOut);
        
        await communityVault.connect(trader).redeemDXBL(asUSDCToken(NET).address, inUnits(burn.toString(), 18), bn(estOut).mul(999).div(10000), false);
        const postBal = +inDecs(await dxblToken.balanceOf(trader.address));
        if(bal - postBal != 1000) {
            throw new Error("Expected to burn 1k tokens: " + postBal);
        }
        const traderUSDC = +inDecs(await asUSDCContract(ethers.provider, NET).balanceOf(trader.address), 6);
        const expected = Math.floor(usdNav * 1000);
        if(traderUSDC < expected) {
            throw new Error("Expected USDC reward: " + expected + " but received " + traderUSDC);
        }

        usdNav = +inDecs(nav, USD_PRECISION);
        bal = +inDecs(await dxblToken.balanceOf(trader.address), 18);
        console.log("Post-Nav:", usdNav, "Post-Bal", bal);
        console.log("Assets", await communityVault.assets());
    });
    

    const showState = async (prefix) => {
        const {communityVault: vault, dxblToken, wallets} = props;
        const trader = wallets.all[2];
        const v = await vault.dailyVolumeUSD();
        const mr = await vault.currentMintRateUSD();
        const nav = await vault.currentNavUSD();
        const aum = await vault.aumUSD();
        const dBal = await dxblToken.balanceOf(trader.address);

        console.log("-".repeat(50));
        console.log(`${prefix} State: dxblTokens: ${inDecs(dBal, 18)} vol: ${inDecs(v, USD_PRECISION)}, aum: ${inDecs(aum, USD_PRECISION)} mr: ${inDecs(mr, USD_PRECISION)} nav: ${inDecs(nav, USD_PRECISION)}`);
        console.log("-".repeat(50));
    }

    it("Should roll over 24hr volume correctly", async () => {
        const {communityVault,dxblToken, wallets} = props;
        const trader = wallets.all[2];

        let cnt = 1;
        await showState(cnt);
        const values = [
            5000,
            1000,
            1_000_000,
            5_000_000,
            15_000_000,
            50_000_000,
            10_000_000,
            20_000_000,
            150_000,
            75_000
        ];

        for(let i=1;i<=10;++i) {
            const v = values[i%values.length];

            await simulateTrade({
                usdcAmount: v,
                timestamp: timestamp + ((HR/2)*i),
                burnPerc: 0
            });
            await showState(++cnt)
        }

        const burnAmt = await dxblToken.balanceOf(trader.address);
        const estOut = await props.communityVault.estimateRedemption(feeTokens[NET][0].token, burnAmt);
        
        console.log("Will burn", inDecs(burnAmt, 18), "for", estOut);
        const txn = await communityVault.connect(trader).redeemDXBL(feeTokens[NET][0].token, burnAmt, bn(estOut).mul(999).div(10000), false);
        const r = await txn.wait();
        console.log("GAS USED", r.gasUsed.toString());
        await showState(++cnt)

        await simulateTrade({
            usdcAmount: 127_000,
            timestamp: timestamp + DAY + (HR*6) + 5,
            burnPerc: 100
        });
        await showState(++cnt)
        timestamp =  timestamp + DAY + (HR*6) + 5;
    });
});