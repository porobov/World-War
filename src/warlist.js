const fetch = require('node-fetch');

// Replace <YOUR_SUBGRAPH_NAME> with your actual subgraph name
const GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/<YOUR_SUBGRAPH_NAME>';

async function fetchWarlist() {
  const query = `
    {
      winners(orderBy: newBudget, orderDirection: desc) {
        id
        newWinner
        newBudget
        blockNumber
        transactionHash
      }
    }
  `;

  const response = await fetch(GRAPH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  return data.winners;
}

// Example usage:
fetchWarlist().then(warlist => {
  console.log(warlist);
});

module.exports = { fetchWarlist }; 