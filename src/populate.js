const hre = require("hardhat");
const fs = require("fs");

async function populateWorldWar() {
  // Read contract address from file
  const addresses = JSON.parse(fs.readFileSync("docs/constants/addresses.json"));
  const contractAddress = addresses.WorldWar;
  if (!contractAddress) {
    throw new Error("WorldWar contract address not found in docs/constants/addresses.json");
  }

  // Get multiple signers for local development
  const [owner, partner, player1, player2] = await hre.ethers.getSigners();

  // Get the contract instance at the deployed address
  const WorldWar = await hre.ethers.getContractFactory("WorldWar");
  const worldWar = WorldWar.attach(contractAddress);

  // Read current budget from deployed contract
  let currentBudget = await worldWar.currentBudget();
  console.log("Current budget:", currentBudget);

  // Two winners with two different signers
  const winner1 = { name: "Alexander the Great", signer: player1 };
  const winner2 = { name: "Napoleon Bonaparte", signer: player2 };
  const winners = [winner1, winner2];
  const winnerAddresses = [];

  for (const winner of winners) {
    // Calculate new budget (110% of current budget as per contract)
    currentBudget = currentBudget * 110n / 100n;
    console.log(`\nBeating with ${winner.name} using ${currentBudget} wei from ${winner.signer.address}`);
    // Call beat function using the winner's signer
    const tx = await worldWar.connect(winner.signer).beat(winner.name, { value: currentBudget });
    await tx.wait();
    // Get the current winner and budget after the transaction
    const currentWinner = await worldWar.currentWinner();
    const newBudget = await worldWar.currentBudget();
    console.log(`Successfully beat with ${winner.name}`);
    console.log(`New current winner: ${currentWinner}`);
    console.log(`New budget: ${newBudget} wei`);
    winnerAddresses.push(winner.signer.address);
  }

  console.log("\nAll battles completed!");
}

// export main function
module.exports = { populateWorldWar };

populateWorldWar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
