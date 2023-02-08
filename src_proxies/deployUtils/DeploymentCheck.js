
class DeploymentCheck {

    static deploymentDiff = async (step) => {
        const ctx = step.sequence.context;
        const dep = await ctx.deployments.getOrNull(step.name);
        const current = await ctx.ethers.getContractFactory(step.name, {
            libraries: step.getLibraries()
        });
        if(!dep) {
            //not deployed, so it's clearly different
            console.log(`Contract ${step.name} is not deployed`);
            return {hasDiff: true};
        }
        if(!current) {
            throw new Error("Could not find contract with name: " + step.name);
        }
        const depHash = ctx.ethers.utils.keccak256(dep.bytecode);
        const curHash = ctx.ethers.utils.keccak256(current.bytecode);
        const hasDiff = depHash != curHash;
        if(hasDiff) {
            console.log(`Contract ${step.name} has diffs`);
            console.log(depHash);
            console.log("------ VS --------");
            console.log(curHash);
        }
        return {deployed: dep, hasDiff};
    }
}

module.exports = {
    DeploymentCheck
}