const socket = io("http://localhost:5000");
let account;
let currentMatch = {};

const connectWalletBtn = document.getElementById("connectWalletBtn");
const findMatchBtn = document.getElementById("findMatchBtn");
const buyBtn = document.getElementById("buyBtn");

const sections = {
    buy: document.getElementById('buy-section'),
    matchmaking: document.getElementById('matchmaking-section'),
    game: document.getElementById('game-section'),
};

const matchStatusEl = document.getElementById("matchStatus");
const boardEl = document.getElementById("tic-tac-toe-board");
const gameStatusEl = document.getElementById("game-status");

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function setLoading(button, isLoading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    button.disabled = isLoading;
    if (text) text.style.display = isLoading ? 'none' : 'inline-flex';
    if (spinner) spinner.style.display = isLoading ? 'block' : 'none';
}

function showSection(sectionName) {
    Object.values(sections).forEach(section => section.classList.remove('active'));
    if (sections[sectionName]) sections[sectionName].classList.add('active');
}

connectWalletBtn.addEventListener("click", async () => {
    if (!window.ethereum) return showToast("MetaMask is not installed!", "error");
    setLoading(connectWalletBtn, true);
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        account = accounts[0];
        const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
        connectWalletBtn.querySelector('.btn-text').innerHTML = `<i class="fas fa-check-circle"></i> Connected: ${shortAddress}`;
        showToast("Wallet connected successfully!", "success");
        connectWalletBtn.disabled = true;
        setLoading(connectWalletBtn, false);
        showSection('matchmaking');
    } catch (error) {
        showToast("Failed to connect wallet.", "error");
        setLoading(connectWalletBtn, false);
    }
});

buyBtn.addEventListener("click", async () => {
    if (!account) return showToast("Please connect your wallet first.", "error");
    const amount = document.getElementById("buyAmount").value;
    if (!amount || amount <= 0) return showToast("Please enter a valid amount.", "error");
    setLoading(buyBtn, true);
    try {
        const res = await fetch("/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, to: account }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast(`Purchase successful!`, "success");
    } catch (error) {
        showToast(`Error purchasing tokens: ${error.message}`, "error");
    } finally {
        setLoading(buyBtn, false);
    }
});

findMatchBtn.addEventListener("click", () => {
    if (!account) return showToast("Please connect your wallet first.", "error");
    setLoading(findMatchBtn, true);
    matchStatusEl.textContent = "Searching for an opponent...";
    socket.emit("findMatch", account);
});

socket.on("statusUpdate", (message) => matchStatusEl.textContent = message);

socket.on("matchFound", (gameData) => {
    setLoading(findMatchBtn, false);
    currentMatch = gameData;
    const userPlayer = gameData.players.find(p => p.address.toLowerCase() === account.toLowerCase());
    const opponent = gameData.players.find(p => p.address.toLowerCase() !== account.toLowerCase());
    currentMatch.mySymbol = userPlayer.symbol;
    const opponentName = opponent.address === "0x00000000000000000000000000000000000000AI" ? "AI" : "Player";
    showToast(`Match found vs ${opponentName}!`, "success");
    createBoard();
    updateBoardState(gameData.board, gameData.turn);
    showSection('game');
});

socket.on("updateBoard", ({ board, turn }) => {
    updateBoardState(board, turn);
});

socket.on("gameOver", ({ winner, winnerAddress }) => {
    const isWinner = winner === currentMatch.mySymbol;
    const isDraw = winner === 'draw';

    if (isDraw) {
        gameStatusEl.textContent = "It's a draw!";
        showToast("The match ended in a draw.", "info");
    } else if (isWinner) {
        gameStatusEl.textContent = "You are victorious!";
        showToast("You won! Payout processing...", "success");
    } else {
        gameStatusEl.textContent = "You were defeated.";
        showToast("You lost the match.", "error");
    }

    boardEl.querySelectorAll('.cell').forEach(cell => cell.classList.add('disabled'));

    setTimeout(() => {
        showSection('matchmaking');
        matchStatusEl.textContent = "Ready to find an opponent?";
    }, 5000);
});

function createBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardEl.appendChild(cell);
    }
}

function handleCellClick(index) {
    if (currentMatch.turn === currentMatch.mySymbol && !currentMatch.board[index] && !currentMatch.gameOver) {
        socket.emit("playerMove", { matchId: currentMatch.matchId, cellIndex: index });
    }
}

function updateBoardState(board, turn) {
    currentMatch.board = board;
    currentMatch.turn = turn;

    board.forEach((value, index) => {
        const cell = boardEl.querySelector(`.cell[data-index='${index}']`);
        if(cell) {
            cell.textContent = value;
            cell.className = 'cell';
            if (value) cell.classList.add(value);
        }
    });

    if (currentMatch.gameOver) return;

    if (turn === currentMatch.mySymbol) {
        gameStatusEl.textContent = "Your turn.";
        boardEl.querySelectorAll('.cell').forEach(c => c.classList.remove('disabled'));
    } else {
        gameStatusEl.textContent = "Opponent's turn...";
        boardEl.querySelectorAll('.cell').forEach(c => c.classList.add('disabled'));
    }
}

showSection('buy');