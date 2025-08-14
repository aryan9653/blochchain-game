const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
require("dotenv").config(); // Ensures variables are loaded for this module

// Set up provider and signer wallet once
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load ABIs
const playGameAbi = require("../abi/PlayGame.json").abi;
const gameTokenAbi = require("../abi/GameToken.json").abi;

/**
 * @route   POST /match/stake
 * @desc    Approve and stake game tokens for a match
 */
router.post("/stake", async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "A valid amount is required." });
        }

        // ✅ Access environment variables safely inside the handler
        const gameTokenAddress = process.env.GAME_TOKEN_ADDRESS;
        const playGameAddress = process.env.PLAY_GAME_ADDRESS;

        if (!gameTokenAddress || !playGameAddress) {
            throw new Error("Contract addresses are not configured in .env file.");
        }

        // Create contract instances
        const tokenContract = new ethers.Contract(gameTokenAddress, gameTokenAbi, wallet);
        const playGameContract = new ethers.Contract(playGameAddress, playGameAbi, wallet);
        
        // Convert the amount to the correct unit (assuming 18 decimals)
        const amountInWei = ethers.parseUnits(amount.toString(), 18);

        // 1️⃣ Approve the PlayGame contract to spend the user's tokens
        console.log(`Approving ${playGameAddress} to spend ${amount} tokens...`);
        const approveTx = await tokenContract.approve(playGameAddress, amountInWei);
        await approveTx.wait(); // Wait for the approval transaction to be mined
        console.log(`Approval successful! Tx: ${approveTx.hash}`);

        // 2️⃣ Call the stakeTokens function on the PlayGame contract
        console.log(`Staking ${amount} tokens...`);
        const stakeTx = await playGameContract.stakeTokens(amountInWei);
        await stakeTx.wait(); // Wait for the stake transaction to be mined
        console.log(`Staking successful! Tx: ${stakeTx.hash}`);

        res.json({ success: true, txHash: stakeTx.hash });

    } catch (error) {
        console.error("Stake Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /match/commit
 * @desc    Commit the result of a match by providing the winner's address
 */
router.post("/commit", async (req, res) => {
    try {
        const { winner } = req.body;

        // ✅ Validate the winner address to prevent ENS errors
        if (!winner || !ethers.isAddress(winner)) {
            return res.status(400).json({ error: "A valid winner address is required." });
        }

        const playGameAddress = process.env.PLAY_GAME_ADDRESS;
        if (!playGameAddress) {
            throw new Error("PLAY_GAME_ADDRESS is not configured in .env file.");
        }

        const playGameContract = new ethers.Contract(playGameAddress, playGameAbi, wallet);

        console.log(`Committing winner: ${winner}...`);
        const tx = await playGameContract.commitResult(winner);
        await tx.wait();
        console.log(`Winner committed! Tx: ${tx.hash}`);

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error("Commit Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;