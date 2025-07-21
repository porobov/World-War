const hre = require("hardhat");
const fs = require("fs");

async function moveOwnership() {
  // Hardcoded new addresses
  const NEW_OWNER = "0x0230c6dD5DB1d3F871386A3CE1A5a836b2590044";
  const NEW_PARTNER = "0x0230c6dD5DB1d3F871386A3CE1A5a836b2590044";

  // Get signers (same as deploy.js)
  const [owner, partner] = await hre.ethers.getSigners();
  console.log("Current Owner:", owner.address);
  console.log("Current Partner:", partner.address);

  // Get network name
  const networkName = hre.network.name;

  // Read contract address
  let addresses = {};
  try {
    addresses = JSON.parse(fs.readFileSync("docs/constants/addresses.json"));
  } catch (e) {
    throw new Error("Could not read addresses.json");
  }
  const contractAddress = addresses[networkName]?.WorldWar;
  if (!contractAddress) throw new Error(`No contract address for network ${networkName}`);
  console.log("WorldWar contract address:", contractAddress);

  // Read ABI
  const abi = JSON.parse(fs.readFileSync("docs/constants/abi.json")).abi;

  // Connect as owner and transfer ownership
  const contractAsOwner = new hre.ethers.Contract(contractAddress, abi, owner);
  console.log(`Transferring ownership to ${NEW_OWNER} ...`);
  const tx1 = await contractAsOwner.transferOwnership(NEW_OWNER);
  await tx1.wait();
  console.log("Ownership transferred.");

  // Connect as partner and set new partner address
  const contractAsPartner = new hre.ethers.Contract(contractAddress, abi, partner);
  console.log(`Setting new partner address to ${NEW_PARTNER} ...`);
  const tx2 = await contractAsPartner.setPartnerAddress(NEW_PARTNER);
  await tx2.wait();
  console.log("Partner address updated.");
}

moveOwnership().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
