const {bn, units} = require("../utils");
const {DeploymentCheck} = require("./DeploymentCheck");

const sleep = ms => new Promise((d)=> setTimeout(d, ms));
class Deployer {

    static run = async ({sequence}) => {
        let gasUsed = bn(0);
        for(let i=0;i<sequence.steps.length;++i) {
            const gu = await Deployer.deploy({context: sequence.context, step: sequence.steps[i]});
            if(gu) {
                gasUsed = gasUsed.add(gu);
            }
        }
        console.log("Total fees @150gwei for all deployments", units.fmtUnits(gasUsed.mul(150), 9));
    }

    static deploy = async ({context, step}) => {
        const ethers = context.ethers;
        if(!step.isDeployment) {
            console.log(`Running non-deployment step ${step.name}`);
            await step.run();
            await step.updateContext();
            return;
        }

        let hasDiff = false;
        let deployed = null;
        if(!context.forceDeploy) {
            let {hasDiff : hd, deployed: dep} = await DeploymentCheck.deploymentDiff(step);
            hasDiff = hd;
            deployed = dep;
        } else {
            hasDiff = true;
        }
        
        if(!hasDiff) {
            console.log(`Skipping ${step.name} deployment since same as deployed bytecode`);
            if(step.isProxy) {
                deployed = await step.maybeUpgrade({deployed});
            }
            await step.updateContext({deployed})
            return;
        }
        
        console.log(`Deploying ${step.name} since it's different than deployed bytecode`);

        const libraries = await step.getLibraries();
        const args = await step.getDeployArgs();
        console.log("Pausing between deployment steps...");
        if(context.insertPause) {
            await sleep(5000);
        }
        
        console.log(`Deploying ${step.name} with args: ${args}`);
        const con = await context.deployments.deploy(step.name, {
            log: true,
            libraries,
            from: step.getDeployerWallet().address,
            args
        });
        console.log("Deployment gas used", con.receipt.gasUsed.toString());
        await step.updateContext({deployed: con});
        console.log(`Deployed ${step.name} to ${con.address}`);
        step.deployedNew = true;
        return con.receipt.gasUsed;

        /*
        let con = await ethers.getContractFactory(step.name, {
            libraries: await step.getLibraries()
        }, step.getDeployerWallet());

        if(!con) {
            throw new Error(`Could not find ${step.name}`);
        }
        console.log(`Deploying ${step.name}...`);
        const args = await step.getDeployArgs();

        
        deployed = await (args ? con.deploy(...args) : con.deploy());
        console.log("Deployment txn", deployed.deployTransaction.hash);
        console.log("Estimated gas", deployed.deployTransaction.gasLimit.toString());
        console.log("Nonce", deployed.deployTransaction.nonce);
        const r = await deployed.deployTransaction.wait();
        await step.updateContext({deployed});
        console.log(`Deployed ${step.name} to ${deployed.address}`);
        console.log(`Cost ${r.gasUsed.toString()}`);
        step.deployedNew = true;
        return r.gasUsed;
        */
        
    }
}

module.exports = {
    Deployer
}