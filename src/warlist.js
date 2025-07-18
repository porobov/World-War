const GRAPH_API_URL = 'https://api.studio.thegraph.com/query/2388/ww-sepolia-1/version/latest';

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
if (require.main === module) {
  fetchWarlist()
    .then(warlist => {
      console.log('Fetched warlist:', warlist);
    })
    .catch(err => {
      console.error('Error fetching warlist:', err);
    });
}

module.exports = { fetchWarlist }; 