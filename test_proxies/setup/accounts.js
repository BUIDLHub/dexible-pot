const setupAccounts = async (props) => {
    let accounts = await ethers.getSigners();
    
    let owner = accounts[0];
    let trader = accounts[1];
    let proxyAdmin = accounts[3];
    props.wallets = {
        owner,
        proxyAdmin,
        all: accounts,
        trader,
        trader2: accounts[2],
        trader3: accounts[3],
        relay: accounts[4],
        affiliate: accounts[5]
    }
    return props;
};

module.exports = {
    setupAccounts
}