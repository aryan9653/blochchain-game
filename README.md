# Game Platform (Smart Contracts + Backend + Web + Leaderboard)

A complete blockchain-powered game platform comprising smart contracts, backend API, web frontend, and leaderboard functionality.

[![Node.js CI](https://github.com/aryan9653/blochchain-game/actions/workflows/node.js.yml/badge.svg)](https://github.com/aryan9653/blochchain-game/actions/workflows/node.js.yml)

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation & Setup](#installation--setup)
* [Running the Platform](#running-the-platform)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Testing](#testing)
* [License](#license)

## Overview

This repository delivers a fully integrated game ecosystem involving:

* **Smart Contracts**—likely in Solidity, providing core on‑chain game logic.
* **Backend API**—handles interactions with smart contracts and game logic off‑chain.
* **Web Frontend**—user interface for gameplay and leaderboard display.
* **Leaderboard Module**—tracks and shows player standings.

Written primarily in JavaScript with a mix of HTML, CSS, and Solidity.

## Features

* Smart contract deployment via Hardhat.
* Backend API serving game data and facilitating transactions.
* Web frontend for gameplay and viewing results.
* Leaderboard integration.
* Modular project organization (e.g., `api`, `contracts`, `web`).

## Prerequisites

* **Node.js** (LTS recommended) and **npm** installed.
* A compatible Ethereum development environment (e.g., Hardhat, Ganache).
* For production, an Ethereum node or provider (e.g., Infura, Alchemy).

## Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/aryan9653/blochchain-game.git
   cd blochchain-game
   ```

2. Navigate to the `api` directory and configure environment variables:

   ```bash
   cd api
   cp .env.example .env
   ```

3. Install dependencies for each component:

   ```bash
   # In root
   npm install

   # Then for each subfolder:
   cd api && npm install
   cd contracts && npm install
   cd web && npm install
   ```

## Running the Platform

1. **Deploy smart contracts**

   ```bash
   cd contracts
   npx hardhat compile
   npx hardhat deploy
   ```

2. **Start the backend API**

   ```bash
   cd api
   npm start
   ```

3. **Launch the web frontend**

   ```bash
   cd web
   npm start
   ```

   Open your browser at `http://localhost:3000`.

## Project Structure

```
/
├── api/          # Backend: environment config, routes, controllers
├── contracts/    # Smart contracts and Hardhat config
├── ignition/modules/  # Game modules or deployment tools
├── test/         # Smart contract or API tests
├── tools/        # Utility scripts
├── web/          # Frontend application
├── package.json
├── hardhat.config.js
├── .gitignore
└── README.md
```

## Environment Variables

Make sure to configure (in `api/.env`):

* Blockchain network endpoint (e.g., RPC URL).
* Private keys or mnemonic (for contract deployment).
* Any API keys (if required for external services).
  Consult `.env.example` as a reference.

## Testing

Run tests using the command(s) defined in your `package.json`:

```bash
# e.g., for contracts:
npx hardhat test

# or for API:
cd api && npm test
```


