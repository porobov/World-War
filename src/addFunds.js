// using hardhat send (mint) eth to the list of addresses
const { ethers } = require("hardhat");

async function addFunds() {
    const [owner] = await ethers.getSigners();
    const addresses = ["0x0230c6dD5DB1d3F871386A3CE1A5a836b2590044"];
    const amount = ethers.parseEther("1");
    for (const address of addresses) {
        await owner.sendTransaction({ to: address, value: amount });
    }
}

addFunds().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

module.exports = { addFunds };