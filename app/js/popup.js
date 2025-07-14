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
warList.sort((a, b) => b.budget - a.budget);

const beatButton = document.getElementById('beatButton');

function disableBeatButton() {
    beatButton.classList.add('inactive');
    beatButton.style.pointerEvents = 'none';
}

function enableBeatButton() {
    beatButton.classList.remove('inactive');
    beatButton.style.pointerEvents = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
    const beatButton = document.getElementById('beatButton');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('closePopup');
    const currentWinner = document.getElementById('currentWinner');
    const newName = document.getElementById('newName');
    const currentBudget = document.getElementById('currentBudget');
    const newBudget = document.getElementById('newBudget');
    const payToWin = document.getElementById('payToWin');
    const losersList = document.querySelector('.losers');

    for (let i = 1; i < warList.length; i++) {
        const loserElement = document.createElement('div');
        loserElement.className = 'loser';
        loserElement.textContent = `${i}. ${warList[i].text} (${warList[i].budget} ETH)`;
        losersList.appendChild(loserElement);
    }

    beatButton.addEventListener('click', function() {
        // Получаем первый элемент из списка проигравших
        const firstLoser = document.querySelector('.loser');

        if (firstLoser) {
            // Получаем положение и размеры первого проигравшего
            const rect = firstLoser.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Позиционируем popup под первым проигравшим
            popup.style.position = 'absolute';
            popup.style.top = (rect.bottom + scrollTop) + 'px';
            popup.style.left = '50%';
            popup.style.transform = 'translateX(-50%)';
            popup.style.bottom = 'auto'; // Сбрасываем bottom

            // Показываем popup
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

            document.querySelectorAll('.loser').forEach((el, idx) => {
                if (idx === 0) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }
    });

    closePopup.addEventListener('click', function() {
        // Меняем анимацию закрытия
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 500); // Время должно соответствовать времени transition в CSS

        enableBeatButton();
        currentWinner.style.display = 'inline-block';
        newName.style.display = 'none';
        currentBudget.classList.remove('underline', 'hidden');
        newBudget.style.display = 'none';

        const loserElements = document.querySelectorAll('.loser');
        loserElements.forEach(el => el.classList.remove('hidden'));
    });

    setTimeout(() => {
        popup.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    newBudget.addEventListener('focus', function() {
        this.value = ''; // Clear the input when focused
    });

    payToWin.addEventListener('click', function() {
        const newBudgetValue = parseFloat(newBudget.value);
        const currentBudgetValue = parseFloat(currentBudget.textContent);

        if (newBudgetValue > currentBudgetValue && newName.value.trim() !== '') {
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
            newName.value = ''; // Очистка поля ввода имени
            newBudget.value = ''; // Очистка поля ввода бюджета
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
