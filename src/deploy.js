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

  // Determine current network name
  const networkName = hre.network.name;

  // Read existing addresses.json if it exists, else start with empty object
  let addresses = {};
  try {
    addresses = JSON.parse(fs.readFileSync("docs/constants/addresses.json"));
  } catch (e) {
    // file does not exist or is invalid, start fresh
    addresses = {};
  }

  // Overwrite only the current network's address
  addresses[networkName] = { WorldWar: contractAddress };

  // Save updated addresses.json
  fs.writeFileSync("docs/constants/addresses.json", JSON.stringify(addresses, null, 2));

  // save contract abi to /docs/constants/abi.json in the correct format
  const artifact = require("../artifacts/contracts/WorldWar.sol/WorldWar.json");
  fs.writeFileSync(
    "docs/constants/abi.json",
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log("Deployment complete. Contract address saved to docs/constants/addresses.json");
}

// export main function
module.exports = { deployWorldWar };

deployWorldWar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 