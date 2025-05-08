const hre = require("hardhat");

async function main() {
  // Get multiple signers for local development
  const [owner, partner, player] = await hre.ethers.getSigners();
  
  console.log("Using accounts:");
  console.log("Owner:", owner.address);
  console.log("Partner:", partner.address);
  console.log("Player:", player.address);

  // Get the contract factory
  const WorldWar = await hre.ethers.getContractFactory("WorldWar");
  
  // Deploy the contract with owner and partner addresses
  const worldWar = await WorldWar.deploy(owner.address, partner.address);
  await worldWar.waitForDeployment();

  console.log("WorldWar deployed to:", await worldWar.getAddress());

  // Array of winners for testing
  const winners = [
    "Alexander the Great",
    "Napoleon Bonaparte",
    "Genghis Khan",
    "Julius Caesar",
    "Hannibal Barca",
    "Sun Tzu",
    "Attila the Hun",
    "Saladin",
    "William the Conqueror",
    "Charlemagne"
  ];

  // Initial budget in wei (100 wei as per contract)
  let currentBudget = hre.ethers.parseEther("0.0000000000000001"); // 100 wei

  // Call beat function for each winner using the player account
  for (const winner of winners) {
    // Calculate new budget (110% of current budget as per contract)
    currentBudget = currentBudget * 110n / 100n;
    
    console.log(`\nBeating with ${winner} using ${currentBudget} wei`);
    
    // Call beat function using the player account
    const tx = await worldWar.connect(player).beat(winner, { value: currentBudget });
    await tx.wait();
    
    // Get the current winner and budget after the transaction
    const currentWinner = await worldWar.currentWinner();
    const newBudget = await worldWar.currentBudget();
    
    console.log(`Successfully beat with ${winner}`);
    console.log(`New current winner: ${currentWinner}`);
    console.log(`New budget: ${newBudget} wei`);
  }

  // Check final balances
  const ownerBalance = await worldWar.getBalance(owner.address);
  const partnerBalance = await worldWar.getBalance(partner.address);
  
  console.log("\nFinal balances:");
  console.log("Owner balance:", hre.ethers.formatEther(ownerBalance), "ETH");
  console.log("Partner balance:", hre.ethers.formatEther(partnerBalance), "ETH");
  console.log("\nAll battles completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 