# World war

## Quickstart  

### 1. Install Dependencies  
```bash
npm install  # or `yarn install`
```

### 2. Start a Local Blockchain (Hardhat Network)  
Spin up a local Ethereum node for development:  
```bash
npx hardhat node
```
This will start a local network and display accounts with test ETH.  

### 3. Deploy Contracts  
In a **new terminal**, deploy the contracts to your local network:  
```bash
npx hardhat run scripts/deploy.js --network localhost
```
This will output the deployed contract addresses.  

### 4. Connect the Frontend  
Use the contract address from the deploy script in your frontend (e.g., via `ethers.js` or `web3.js`).  

Example connection snippet (JavaScript):  
```javascript
const { ethers } = require("ethers");
const contractABI = require("./artifacts/contracts/YourContract.sol/YourContract.json").abi;

const provider = new ethers.providers.Web3Provider(window.ethereum);
const contractAddress = "0x..."; // Replace with your deployed address
const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());
```