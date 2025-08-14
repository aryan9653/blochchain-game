const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// --- Server Setup ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(express.static("../web")); // Serves files from the 'web' folder

// --- Game State Management ---
let waitingPlayer = null;
const games = {}; // Stores the state of all active games
const AI_PLAYER_ADDRESS = "0x00000000000000000000000000000000000000AI";

// --- Matchmaking & Game Logic ---
io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // ✅ UPDATED: Now accepts a data object { playerAddress, stake }
    socket.on("findMatch", (data) => {
        const { playerAddress, stake } = data;
        if (!playerAddress || !stake) return; // Ignore invalid requests

        if (waitingPlayer && waitingPlayer.stake === stake) {
            // --- Human vs Human Match Found ---
            console.log(`Human match found: ${waitingPlayer.address} vs ${playerAddress} for ${stake} GT`);
            const opponent = waitingPlayer;
            clearTimeout(opponent.timeout);
            waitingPlayer = null;
            
            // ✅ UPDATED: Pass the stake to the createGame function
            const matchId = createGame(opponent.address, playerAddress, stake, opponent.socketId, socket.id);
            io.to(matchId).emit("matchFound", games[matchId]);

        } else {
            // --- Player is now waiting ---
            if (waitingPlayer) {
                 socket.emit("statusUpdate", `Waiting for a player with a ${waitingPlayer.stake} GT stake...`);
                 return;
            }
            
            // ✅ UPDATED: Store the stake amount with the waiting player
            waitingPlayer = { 
                socketId: socket.id, 
                address: playerAddress,
                stake: stake,
                timeout: setTimeout(() => {
                    console.log(`Matching ${playerAddress} with an AI for ${stake} GT.`);
                    if (!waitingPlayer || waitingPlayer.socketId !== socket.id) return;
                    
                    // ✅ UPDATED: Pass the stake to the createGame function for AI match
                    const matchId = createGame(playerAddress, AI_PLAYER_ADDRESS, stake, socket.id, null);
                    io.to(socket.id).emit("matchFound", games[matchId]);
                    waitingPlayer = null;
                }, 10000) // 10-second timeout
            };
            console.log(`${playerAddress} is waiting for a match with a ${stake} GT stake...`);
            socket.emit("statusUpdate", "Searching for an opponent...");
        }
    });

    // --- In-Game Move Logic ---
    socket.on("playerMove", ({ matchId, cellIndex }) => {
        const game = games[matchId];
        if (!game || game.gameOver) return;

        const playerSymbol = game.players.find(p => p.socketId === socket.id)?.symbol;
        if (playerSymbol !== game.turn) return;

        if (game.board[cellIndex] === null) {
            game.board[cellIndex] = game.turn;
            
            const winner = checkWinner(game.board);
            if (winner) {
                endGame(matchId, winner);
            } else if (game.board.every(cell => cell !== null)) {
                endGame(matchId, 'draw');
            } else {
                game.turn = game.turn === 'X' ? 'O' : 'X';
                io.to(matchId).emit("updateBoard", { board: game.board, turn: game.turn });

                if (game.players.some(p => p.address === AI_PLAYER_ADDRESS) && game.turn === 'O') {
                    setTimeout(() => makeAIMove(matchId), 1000);
                }
            }
        }
    });

    // --- Disconnect Logic ---
    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        if (waitingPlayer && waitingPlayer.socketId === socket.id) {
            clearTimeout(waitingPlayer.timeout);
            waitingPlayer = null;
            console.log("Waiting player disconnected, queue cleared.");
        }
    });
});


// --- Game Helper Functions ---

// ✅ UPDATED: Now accepts a 'stake' parameter
function createGame(player1Addr, player2Addr, stake, p1SocketId, p2SocketId) {
    const matchId = uuidv4();
    const p1 = { address: player1Addr, symbol: 'X', socketId: p1SocketId };
    const p2 = { address: player2Addr, symbol: 'O', socketId: p2SocketId };

    // ✅ UPDATED: Game object now includes the stake
    games[matchId] = {
        matchId,
        players: [p1, p2],
        stake: stake,
        board: Array(9).fill(null),
        turn: 'X',
        gameOver: false,
        winner: null,
    };
    
    if(p1SocketId) io.sockets.sockets.get(p1SocketId)?.join(matchId);
    if(p2SocketId) io.sockets.sockets.get(p2SocketId)?.join(matchId);

    console.log(`Game created (${matchId}) with stake: ${stake} GT`);
    return matchId;
}

function makeAIMove(matchId) {
    const game = games[matchId];
    if (!game || game.gameOver || game.turn !== 'O') return;
    const emptyCells = [];
    game.board.forEach((cell, index) => { if (cell === null) emptyCells.push(index); });
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        game.board[randomCell] = 'O';
        const winner = checkWinner(game.board);
        if (winner) {
            endGame(matchId, winner);
        } else if (game.board.every(cell => cell !== null)) {
            endGame(matchId, 'draw');
        } else {
            game.turn = 'X';
            io.to(matchId).emit("updateBoard", { board: game.board, turn: game.turn });
        }
    }
}

function endGame(matchId, result) {
    const game = games[matchId];
    if (!game || game.gameOver) return;
    game.gameOver = true;
    game.winner = result;
    
    let winnerAddress = null;
    if(result !== 'draw'){
        winnerAddress = game.players.find(p => p.symbol === result)?.address;
    }
    
    io.to(matchId).emit("gameOver", { winner: result, winnerAddress });
    console.log(`Game over (${matchId}): Winner is ${winnerAddress || 'Draw'}`);
    
    if(winnerAddress && winnerAddress !== AI_PLAYER_ADDRESS) {
        // TODO: This is where you would call your smart contract's commitResult function
        // You would need to pass the matchId and the winnerAddress.
        console.log(`Triggering automatic payout of ${game.stake * 2} GT to ${winnerAddress}`);
    }

    setTimeout(() => delete games[matchId], 60000);
}

function checkWinner(board) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
}

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));