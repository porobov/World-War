require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Helper to load mnemonic from file
function getMnemonic() {
  const mnemonicPath = process.env.PATH_TO_MNEMONIC;
  if (!mnemonicPath) return undefined;
  try {
    const mnemonicObj = require(mnemonicPath);
    return mnemonicObj.mnemonic;
  } catch (e) {
    console.warn("Could not load mnemonic from file:", mnemonicPath, e.message);
    return undefined;
  }
}

const mnemonic = getMnemonic();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.26",
  networks: {
    hardhat: {
      // Local development network
    },
    local: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: mnemonic ? { mnemonic } : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: mnemonic ? { mnemonic } : [],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
