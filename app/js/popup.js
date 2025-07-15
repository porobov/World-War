// List of famous historical figures with their budgets (ETH)
let warList = [
    { budget: 1.0, text: 'Napoléon Bonaparte' }, // Франция
    { budget: 1.1, text: 'Αλέξανδρος ο Μέγας' }, // Греция (Александр Македонский)
    { budget: 1.2, text: 'Gaius Iulius Caesar' }, // Рим (Гай Юлий Цезарь)
    { budget: 1.3, text: 'Чингис хаан' }, // Монголия (Чингисхан)
    { budget: 1.4, text: 'حَنِيبْعَل بن حَمِيلْقَار بَرْقَة' }, // Карфаген (Ганнибал Барка)
    { budget: 1.5, text: 'Пётр I Великий' }, // Россия
    { budget: 1.6, text: 'Екатерина II Великая' }, // Россия
    { budget: 1.7, text: 'Александр Невский' }, // Россия
    { budget: 1.8, text: 'Дмитрий Донской' }, // Россия
    { budget: 1.9, text: 'Суворов Александр Васильевич' }, // Россия
    { budget: 2.0, text: 'Михаил Илларионович Кутузов' }, // Россия
    { budget: 2.1, text: 'Юрий Гагарин' }, // Россия
    { budget: 2.2, text: '孙武 (Sun Tzu)' }, // Китай (Сунь-цзы)
    { budget: 2.3, text: 'صلاح الدين الأيوبي‎ (Saladin)' }, // Арабский мир (Саладин)
    { budget: 2.4, text: 'Ричард Львиное Сердце (Richard the Lionheart)' }, // Англия
    { budget: 2.5, text: 'Карл XII Шведский (Karl XII)' }, // Швеция
    { budget: 2.6, text: 'Владимир Всеволодович Мономах' }, // Россия
    { budget: 2.7, text: 'Иван IV Грозный' }, // Россия
    { budget: 2.9, text: 'Фридрих II Великий (Friedrich der Große)' } // Пруссия
];

// Sort the list by budget in descending order
warList.sort((a, b) => b.budget - a.budget);

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

document.addEventListener('DOMContentLoaded', function() {
    // Populate the losers list (all except the top winner)
    for (let i = 1; i < warList.length; i++) {
        const loserElement = document.createElement('div');
        loserElement.className = 'loser';
        loserElement.textContent = `${i}. ${warList[i].text} (${warList[i].budget} ETH)`;
        losersList.appendChild(loserElement);
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
    payToWin.addEventListener('click', function() {
        const newBudgetValue = parseFloat(newBudget.value);
        const currentBudgetValue = parseFloat(currentBudget.textContent);

        // Validate input: new budget must be higher and name must not be empty
        if (newBudgetValue > currentBudgetValue && newName.value.trim() !== '') {
            const oldWinner = currentWinner.textContent;
            const oldBudget = currentBudgetValue;

            // Update the winner and budget
            currentWinner.textContent = newName.value;
            currentBudget.textContent = newBudgetValue;
            beatButton.textContent = `Beat ${newName.value}`;

            // Add new winner to the warList and re-sort
            warList.push({ budget: newBudgetValue, text: newName.value });
            warList.sort((a, b) => b.budget - a.budget);

            // Add the old winner to the top of the losers list
            const newLoser = document.createElement('div');
            newLoser.className = 'loser';
            newLoser.textContent = `${warList.length - 1}. ${oldWinner} (${oldBudget} ETH)`;
            losersList.insertBefore(newLoser, losersList.firstChild);

            // Clear input fields
            newName.value = '';
            newBudget.value = '';

            // Close the popup and reset UI
            closePopup.click();
            currentBudget.textContent = newBudgetValue;
            currentBudget.classList.remove('underline', 'hidden');
            newBudget.style.display = 'none';
            enableBeatButton();
        } else {
            alert('Please enter a valid name and a budget higher than the current one.');
        }
    });
});
