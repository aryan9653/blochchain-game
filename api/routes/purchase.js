// api/routes/purchase.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load TokenStore ABI
const tokenStoreAbi = require("../abi/TokenStore.json").abi;
const tokenStoreAddress = process.env.TOKEN_STORE_ADDRESS; // <- Add this in .env

router.post("/", async (req, res) => {
    try {
        const { amount, to } = req.body;

        if (!amount || !to) {
            return res.status(400).json({ error: "Amount and recipient address required" });
        }

        const tokenStore = new ethers.Contract(tokenStoreAddress, tokenStoreAbi, wallet);

        // Convert amount to BigNumber with decimals
        const tx = await tokenStore.buyTokens(
            to,
            ethers.parseUnits(amount.toString(), 0), // amount in whole tokens
            { value: ethers.parseEther((amount * 0.001).toString()) } // tokenPrice = 0.001 ETH
        );

        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error("Buy Tokens Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
