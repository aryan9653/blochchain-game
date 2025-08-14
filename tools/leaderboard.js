// Listens to Purchase, Staked, Settled, Refunded events and serves a small leaderboard API.
require("dotenv").config();
const express = require("express");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

const {
  RPC_URL,
  TOKEN_STORE_ADDRESS,
  PLAYGAME_ADDRESS,
  GAME_TOKEN_ADDRESS,
  PORT = 4000,
} = process.env;

if (!RPC_URL) {
  console.warn("RPC_URL missing in .env");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

// load ABIs
function loadAbi(contractName) {
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`ABI for ${contractName} not found. Compile contracts first`);
  }
  const json = JSON.parse(fs.readFileSync(artifactPath));
  return json.abi;
}

const tokenStoreAbi = loadAbi("TokenStore");
const playGameAbi = loadAbi("PlayGame");

const tokenStore = new ethers.Contract(TOKEN_STORE_ADDRESS, tokenStoreAbi, provider);
const playGame = new ethers.Contract(PLAYGAME_ADDRESS, playGameAbi, provider);

// In-memory leaderboard data
const winsByAddress = new Map();
const totalGTWon = new Map();
const matchesPlayed = new Map();

// helper update functions
function addWin(addr, amount) {
  const prevW = winsByAddress.get(addr) || 0;
  winsByAddress.set(addr, prevW + 1);

  const prevG = totalGTWon.get(addr) || ethers.Zero;
  totalGTWon.set(addr, prevG + amount);

  const prevM = matchesPlayed.get(addr) || 0;
  matchesPlayed.set(addr, prevM + 1);
}

function addMatchPlayed(addr) {
  const prev = matchesPlayed.get(addr) || 0;
  matchesPlayed.set(addr, prev + 1);
}

// Subscribe to events
(async () => {
  console.log("Leaderboard listener starting...");

  // Purchase event from TokenStore
  try {
    tokenStore.on("Purchase", (buyer, usdtAmount, gtOut, event) => {
      console.log("Purchase:", buyer, usdtAmount.toString(), gtOut.toString());
      // track as a played match? we won't.
    });
  } catch (e) {
    console.warn("Failed to attach Purchase listener:", e.message);
  }

  // PlayGame events
  try {
    playGame.on("Staked", (matchId, player, event) => {
      // Staked(matchId, player) in our contract has (bytes32, address)
      console.log("Staked", matchId, player);
      addMatchPlayed(player);
    });

    playGame.on("Settled", (matchId, winner, payout, event) => {
      console.log("Settled", matchId, winner, payout.toString());
      addWin(winner, payout);
    });

    playGame.on("Refunded", (matchId, event) => {
      console.log("Refunded", matchId);
    });
  } catch (e) {
    console.warn("Failed to attach PlayGame listeners:", e.message);
  }
})();

// Express endpoint to serve top 10 winners by GT won
const app = express();
app.get("/leaderboard", (req, res) => {
  // build array from totalGTWon
  const rows = [];
  for (const [addr, won] of totalGTWon.entries()) {
    const wins = winsByAddress.get(addr) || 0;
    const played = matchesPlayed.get(addr) || 0;
    rows.push({ address: addr, totalGTWon: won.toString(), wins, played });
  }
  rows.sort((a, b) => {
    // compare BigInts by string length then lexicographically
    if (a.totalGTWon.length !== b.totalGTWon.length) return b.totalGTWon.length - a.totalGTWon.length;
    return b.totalGTWon.localeCompare(a.totalGTWon);
  });
  res.json(rows.slice(0, 10));
});

app.listen(PORT, () => console.log(`Leaderboard API running at http://localhost:${PORT}`));
