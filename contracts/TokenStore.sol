// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

contract TokenStore is Ownable {
    GameToken public gameToken;
    uint256 public tokenPrice = 0.001 ether; // 1 GT = 0.001 ETH

    event TokensPurchased(address indexed buyer, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        gameToken = GameToken(_token);
    }

    function buyTokens(address to, uint256 amount) public payable {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value == amount * tokenPrice, "Incorrect ETH sent");

        // Mint tokens to recipient
        gameToken.mint(to, amount * (10 ** gameToken.decimals()));
        emit TokensPurchased(to, amount);
    }

    function withdraw(address payable to) public onlyOwner {
        require(address(this).balance > 0, "No ETH to withdraw");
        to.transfer(address(this).balance);
    }

    function setTokenPrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        tokenPrice = newPrice;
    }
}
