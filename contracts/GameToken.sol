// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    address public tokenStore;

    event Minted(address indexed to, uint256 amount);

    constructor() ERC20("GameToken", "GT") Ownable(msg.sender) {
        // Start with zero supply
    }

    modifier onlyTokenStore() {
        require(msg.sender == tokenStore, "Only TokenStore can call");
        _;
    }

    function setTokenStore(address _store) external onlyOwner {
        tokenStore = _store;
    }

    function mint(address to, uint256 amount) external onlyTokenStore {
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
