require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "https://mock-rpc.example.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY || "0x1111111111111111111111111111111111111111111111111111111111111111";

// Mock deployed addresses
const CONTRACT_A = process.env.CONTRACT_A || "0x000000000000000000000000000000000000dead";
const CONTRACT_B = process.env.CONTRACT_B || "0x000000000000000000000000000000000000beef";

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY, OPERATOR_PRIVATE_KEY],
    },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
  },
};
