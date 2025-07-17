const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function populateWorldWar() {
  // Read contract address from file
  const addresses = JSON.parse(fs.readFileSync("docs/constants/addresses.json"));
  const networkName = hre.network.name;
  const contractAddress = addresses[networkName]?.WorldWar;
  if (!contractAddress) {
    throw new Error(`WorldWar contract address not found for network ${networkName} in docs/constants/addresses.json`);
  }

  // Get multiple signers for local development
  const [owner, partner, player1, player2] = await hre.ethers.getSigners();

  // Get the contract instance at the deployed address
  const WorldWar = await hre.ethers.getContractFactory("WorldWar");
  const worldWar = WorldWar.attach(contractAddress);

  // Famous winners list
  const famousWinners = [
    "Alexander the Great",
    "Napoleon Bonaparte",
    "Genghis Khan",
    "Julius Caesar",
    "Hannibal Barca",
    "Saladin",
    "Attila the Hun",
    "William the Conqueror",
    "Frederick the Great",
    "Admiral Yi Sun-sin",
    "Simón Bolívar",
    "George Washington",
    "Erwin Rommel",
    "Dwight D. Eisenhower",
    "Joan of Arc"
  ];

  // Path to store last winner index
  const lastWinnerPath = path.join(__dirname, "../cache/last_winner.json");
  let lastIndex = 0;
  if (fs.existsSync(lastWinnerPath)) {
    try {
      const lastData = JSON.parse(fs.readFileSync(lastWinnerPath));
      if (typeof lastData.lastIndex === "number") {
        lastIndex = lastData.lastIndex;
      }
    } catch (e) {
      // ignore and use 0
    }
  }

  // Pick next two names, cycling if needed
  const winner1Name = famousWinners[lastIndex % famousWinners.length];
  const winner2Name = famousWinners[(lastIndex + 1) % famousWinners.length];
  const winners = [
    { name: winner1Name, signer: player1 },
    { name: winner2Name, signer: player2 }
  ];
  const winnerAddresses = [];

  // Read current budget from deployed contract
  let currentBudget = await worldWar.currentBudget();
  console.log("Current budget:", currentBudget);

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
    console.log(`New current winner: ${currentWinner} with budget: ${newBudget} wei`);
    winnerAddresses.push(winner.signer.address);
  }

  // Save the new last index
  const newLastIndex = (lastIndex + 2) % famousWinners.length;
  fs.mkdirSync(path.dirname(lastWinnerPath), { recursive: true });
  fs.writeFileSync(lastWinnerPath, JSON.stringify({ lastIndex: newLastIndex }, null, 2));

  // After both battles, check if the contract's current winner is not one of the two just used
  const contractCurrentWinner = await worldWar.currentWinner();
  if (!winnerAddresses.includes(contractCurrentWinner)) {
    console.log(`\nA new winner has appeared: ${contractCurrentWinner}`);
  }

  console.log("\nAll battles completed!");
}

// export main function
module.exports = { populateWorldWar };

populateWorldWar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
