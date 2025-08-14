const hre = require("hardhat");

async function main() {
  // Deploy GameToken
  const GameToken = await hre.ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  console.log("GameToken deployed to:", await gameToken.getAddress());

  // Deploy TokenStore
  const TokenStore = await hre.ethers.getContractFactory("TokenStore");
  const tokenStore = await TokenStore.deploy(await gameToken.getAddress());
  await tokenStore.waitForDeployment();
  console.log("TokenStore deployed to:", await tokenStore.getAddress());

  // Deploy PlayGame
  const PlayGame = await hre.ethers.getContractFactory("PlayGame");
  const playGame = await PlayGame.deploy(await gameToken.getAddress());
  await playGame.waitForDeployment();
  console.log("PlayGame deployed to:", await playGame.getAddress());

  // Set token store in GameToken
  await gameToken.setTokenStore(await tokenStore.getAddress());
  console.log("TokenStore address set in GameToken");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
