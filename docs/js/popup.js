console.log("popup.js loaded");
// Use ethers.js from CDN (window.ethers)

// === Alchemy config ===
const ALCHEMY_API_KEY = window.APP_CONFIG.ALCHEMY_API_KEY; // TODO: Replace with your real key
const ALCHEMY_NETWORK = window.APP_CONFIG.ALCHEMY_NETWORK; // e.g., 'goerli', 'sepolia', etc.

// Helper to get Alchemy provider (read-only)
function getAlchemyProvider() {
    return new window.ethers.AlchemyProvider(ALCHEMY_NETWORK, ALCHEMY_API_KEY);
}

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

// Read NewWinner events from the contract
async function fetchWarList() {
    console.log("fetchWarList called");
    const abi = await loadABI();
    console.log("Loaded ABI:", abi);
    const addresses = await loadAddresses();
    console.log("Loaded addresses:", addresses);
    // Use Alchemy for read-only provider
    const provider = getAlchemyProvider();
    const contract = new window.ethers.Contract(addresses.WorldWar, abi, provider);
    const filter = await contract.filters.NewWinner();
    const events = await contract.queryFilter(filter, 0, 'latest');
    console.log("Fetched events:", events); // Debug log

    // Defensive mapping
    return events
        .filter(ev => ev.args && ev.args.newBudget !== undefined && ev.args.newWinner !== undefined)
        .map(ev => {
            console.log("newBudget:", ev.args.newBudget, "type:", typeof ev.args.newBudget);
            return {
                budget: Number(ethers.formatEther(ev.args.newBudget)),
                text: ev.args.newWinner
            };
        });
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
                const contract = new window.ethers.Contract(addresses.WorldWar, abi, signer);
                // Send transaction
                const tx = await contract.beat(newName.value, {
                    value: window.ethers.parseEther(newBudgetValue.toString())
                });
                await tx.wait();

                // On success, update the UI
                const oldWinner = currentWinner.textContent;
                const oldBudget = currentBudgetValue;
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
});
// All code above is browser-compatible and works with static hosting (e.g., GitHub Pages)
