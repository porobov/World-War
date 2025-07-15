// deploy and populate the contract using the deploy and populate functions
const { deployWorldWar } = require("../src/deploy");
const { populateWorldWar } = require("../src/populate");

async function main() {
  await deployWorldWar();
  await populateWorldWar();
}

main();