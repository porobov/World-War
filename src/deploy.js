const hre = require("hardhat");
const fs = require("fs");

async function deployWorldWar() {
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

  // save contract address to /constants/addresses.json
  fs.writeFileSync("constants/addresses.json", JSON.stringify({
    WorldWar: contractAddress
  }, null, 2));

  console.log("Deployment complete. Contract address saved to constants/addresses.json");
}

// export main function
module.exports = { deployWorldWar };

deployWorldWar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 