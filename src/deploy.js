const hre = require("hardhat");

async function main() {
  // Get multiple signers for local development
  const [owner, partner, player1, player2] = await hre.ethers.getSigners();
  
  console.log("Using accounts:");
  console.log("Owner:", owner.address);
  console.log("Partner:", partner.address);
  console.log("Player1:", player1.address);
  console.log("Player2:", player2.address);

  // Get the contract factory
  const WorldWar = await hre.ethers.getContractFactory("WorldWar");
  
  // Deploy the contract with owner and partner addresses
  const worldWar = await WorldWar.deploy(owner.address, partner.address);
  await worldWar.waitForDeployment();

  const contractAddress = await worldWar.getAddress();
  console.log("WorldWar deployed to:", contractAddress);

  // Read current budget from deployed contract
  const currentBudget = await worldWar.currentBudget();
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 