import { NETWORK, PROVIDERS, GRAPH_API_URL } from './config.js';

console.log("popup.js loaded");
// Use ethers.js from CDN (window.ethers)

// Helper to connect to MetaMask and get provider
async function getProvider() {
    if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return new window.ethers.BrowserProvider(window.ethereum);
    } else {
        alert('Please install MetaMask!');
        throw new Error('MetaMask not found');
    }
}

// Fetch ABI JSON from artifacts
async function loadABI() {
    const res = await fetch("constants/abi.json");
    const json = await res.json();
    return json.abi;
}

// Fetch contract addresses
async function loadAddresses() {
    const res = await fetch("constants/addresses.json");
    return await res.json();
}

// Helper to get contract address for current network
function getContractAddress(addresses) {
    // Use the same network name as NETWORK
    return addresses[NETWORK]?.WorldWar;
}

// Fetch war list from The Graph subgraph
async function fetchWarList() {
    console.log("fetchWarList called (The Graph)");
    const query = `
      {
        winners(orderBy: blockNumber, orderDirection: desc) {
          newWinner
          newBudget
        }
      }
    `;
    const response = await fetch(GRAPH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const { data } = await response.json();
    if (!data || !data.winners) return [];
    return data.winners.map(ev => ({
      budget: Number(window.ethers.formatEther(ev.newBudget)),
      text: ev.newWinner
    }));
}

let warList = [];

// Cache DOM elements for reuse
const beatButton = document.getElementById('beatButton');
const popup = document.getElementById('popup');
const closePopup = document.getElementById('closePopup');
const currentWinner = document.getElementById('currentWinner');
const newName = document.getElementById('newName');
const currentBudget = document.getElementById('currentBudget');
const newBudget = document.getElementById('newBudget');
const payToWin = document.getElementById('payToWin');
const losersList = document.querySelector('.losers');
const connectWallet = document.getElementById('connectWallet');

// Disable the beat button (make it inactive and unclickable)
function disableBeatButton() {
    beatButton.classList.add('inactive');
    beatButton.style.pointerEvents = 'none';
}

// Enable the beat button (make it active and clickable)
function enableBeatButton() {
    beatButton.classList.remove('inactive');
    beatButton.style.pointerEvents = 'auto';
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Setting up DOMContentLoaded handler");
    console.log("DOMContentLoaded fired");
    // Fetch the war list from contract events
    warList = await fetchWarList();
    // Sort the list by budget in descending order
    warList.sort((a, b) => b.budget - a.budget);
    // Populate the losers list (all except the top winner)
    for (let i = 1; i < warList.length; i++) {
        const loserElement = document.createElement('div');
        loserElement.className = 'loser';
        loserElement.textContent = `${i}. ${warList[i].text} (${warList[i].budget} ETH)`;
        losersList.appendChild(loserElement);
    }
    // Set the current winner and budget
    if (warList.length > 0) {
        currentWinner.textContent = warList[0].text;
        currentBudget.textContent = warList[0].budget;
        beatButton.textContent = `Beat ${warList[0].text}`;
    }

    // Show the popup when the beat button is clicked
    beatButton.addEventListener('click', function() {
        // Move current winner to the top of the losers list as the first loser
        const winnerName = currentWinner.textContent;
        const winnerBudget = currentBudget.textContent;
        // Insert the current winner as the first loser
        const newLoser = document.createElement('div');
        newLoser.className = 'loser';
        newLoser.textContent = `1. ${winnerName} (${winnerBudget} ETH)`;
        losersList.insertBefore(newLoser, losersList.firstChild);

        // Get the first loser element
        const firstLoser = document.querySelector('.loser');

        if (firstLoser) {
            // Get the position and size of the first loser
            const rect = firstLoser.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Position the popup below the first loser
            popup.style.position = 'absolute';
            popup.style.top = (rect.bottom + scrollTop) + 'px';
            popup.style.left = '50%';
            popup.style.transform = 'translateX(-50%)';
            popup.style.bottom = 'auto'; // Reset bottom

            // Show the popup with fade-in effect
            popup.style.display = 'block';
            setTimeout(() => {
                popup.style.opacity = '1';
            }, 10);

            disableBeatButton();
            currentWinner.style.display = 'none';
            newName.style.display = 'inline-block';
            currentBudget.classList.add('underline');
            newBudget.value = currentBudget.textContent;
            newBudget.style.display = 'inline-block';
            currentBudget.classList.add('hidden');

            // Hide all losers except the first one
            document.querySelectorAll('.loser').forEach((el, idx) => {
                if (idx === 0) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }
    });

    // Hide the popup when the close button is clicked
    closePopup.addEventListener('click', function() {
        // Animate popup closing
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 500); // Should match CSS transition duration

        enableBeatButton();
        currentWinner.style.display = 'inline-block';
        newName.style.display = 'none';
        currentBudget.classList.remove('underline', 'hidden');
        newBudget.style.display = 'none';

        // Remove the first loser if it matches the current winner
        const firstLoser = losersList.querySelector('.loser');
        if (firstLoser && firstLoser.textContent.includes(currentWinner.textContent)) {
            firstLoser.remove();
        }

        // Show all losers again
        const loserElements = document.querySelectorAll('.loser');
        loserElements.forEach(el => el.classList.remove('hidden'));
    });

    // Scroll popup into view after a short delay (for better UX)
    setTimeout(() => {
        popup.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Clear the new budget input when focused
    newBudget.addEventListener('focus', function() {
        this.value = '';
    });

    // Handle the pay-to-win logic
    payToWin.addEventListener('click', async function() {
        const newBudgetValue = parseFloat(newBudget.value);
        const currentBudgetValue = parseFloat(currentBudget.textContent);

        // Validate input: new budget must be higher and name must not be empty
        if (newBudgetValue > currentBudgetValue && newName.value.trim() !== '') {
            // Show loading state
            payToWin.disabled = true;
            payToWin.textContent = 'Processing...';
            try {
                const abi = await loadABI();
                const addresses = await loadAddresses();
                const provider = await getProvider();
                const signer = await provider.getSigner();
                const contractAddress = getContractAddress(addresses);
                if (!contractAddress) {
                    throw new Error(`WorldWar contract address not found for network ${NETWORK}`);
                }
                const contract = new window.ethers.Contract(contractAddress, abi, signer);
                // Save old winner and budget before transaction
                const oldWinner = currentWinner.textContent;
                const oldBudget = currentBudgetValue;
                // Send transaction
                const tx = await contract.beat(newName.value, {
                    value: window.ethers.parseEther(newBudgetValue.toString())
                });
                await tx.wait();

                // Remove the first loser if it matches the old winner (prevents duplicate)
                const firstLoser = losersList.querySelector('.loser');
                if (firstLoser && firstLoser.textContent.includes(oldWinner)) {
                    firstLoser.remove();
                }

                // On success, update the UI
                currentWinner.textContent = newName.value;
                currentBudget.textContent = newBudgetValue;
                beatButton.textContent = `Beat ${newName.value}`;
                warList.push({ budget: newBudgetValue, text: newName.value });
                warList.sort((a, b) => b.budget - a.budget);
                const newLoser = document.createElement('div');
                newLoser.className = 'loser';
                newLoser.textContent = `${warList.length - 1}. ${oldWinner} (${oldBudget} ETH)`;
                losersList.insertBefore(newLoser, losersList.firstChild);
                newName.value = '';
                newBudget.value = '';
                closePopup.click();
                currentBudget.textContent = newBudgetValue;
                currentBudget.classList.remove('underline', 'hidden');
                newBudget.style.display = 'none';
                enableBeatButton();
            } catch (err) {
                alert('Transaction failed: ' + (err?.message || err));
            } finally {
                payToWin.disabled = false;
                payToWin.textContent = 'Pay to win';
            }
        } else {
            alert('Please enter a valid name and a budget higher than the current one.');
        }
    });

    // Add alert for connectWallet button
    connectWallet.addEventListener('click', function() {
        alert('Supports only MetaMask desktop for now, make sure the MetaMask extension is unlocked and connected to Ethereum Mainnet');
    });
});
// All code above is browser-compatible and works with static hosting (e.g., GitHub Pages)
