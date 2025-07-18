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

## Subgraph

The subgraph indexes `WorldWar` contract events for easy querying.

**Key files:**
- `subgraph/schema.graphql`: Entity definitions
- `subgraph/abis/WorldWar.json`: Contract ABI
- `subgraph/src/mapping.ts`: Event handlers
- `subgraph/subgraph.sepolia.yaml`: Manifest for Sepolia

**Usage:**

1. **Install dependencies**  
   ```bash
   npm install
   ```

2. **Generate types**  
   ```bash
   npx graph codegen --config subgraph/subgraph.sepolia.yaml
   ```

3. **Build subgraph**  
   ```bash
   npx graph build --config subgraph/subgraph.sepolia.yaml
   ```

4. **Deploy**  
   ```bash
   npx graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME> --config subgraph/subgraph.sepolia.yaml
   ```
   Replace `<GITHUB_USER>` and `<SUBGRAPH_NAME>` as needed.

**Query example:**
```graphql
{
  winnerEntities(first: 5) {
    id
    name
    score
  }
}
```