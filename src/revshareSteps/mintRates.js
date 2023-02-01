const { ethers } = require("hardhat");

const BPS = 10_000;
const rate = (n) => ethers.utils.parseUnits((n/100).toFixed(18), 18);

const toMintRate = (min, max, r) => ({
    minMMVolume: min,
    maxMMVolume: max,
    rate: rate(r)
});

const mintRates = [
    toMintRate(0, 1, .93),
    toMintRate(1, 5, .93),
    toMintRate(5, 10, .94),
    toMintRate(10, 15, .96),
    toMintRate(15, 20, .99),
    toMintRate(20, 25, 1.01),
    toMintRate(25,30,1.04),
    toMintRate(30, 35, 1.06),
    toMintRate(35, 40, 1.09),
    toMintRate(40, 45, 1.11),
    toMintRate(45,50,1.14),
    toMintRate(50,75,1.17),
    toMintRate(75,100, 1.33),
    toMintRate(100,140, 1.51),
    toMintRate(140,180,1.88),
    toMintRate(180,220,2.36),
    toMintRate(220,260,2.99),
    toMintRate(260,300,3.83),
    toMintRate(300,400,4.95),
    toMintRate(400,500, 9.7),
    toMintRate(500,600,19.8),
    toMintRate(600,700,41.7),
    toMintRate(700,800,89.88),
    toMintRate(800,900,197.99)
];

module.exports = {
    mintRates
}