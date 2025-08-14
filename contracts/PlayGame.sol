// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PlayGame is ReentrancyGuard {
    IERC20 public gameToken;
    address public owner;

    struct Match {
        address player1;
        address player2;
        uint256 stakeAmount;
        address winner;
        bool isComplete;
    }

    uint256 public matchCounter;
    mapping(uint256 => Match) public matches;

    event MatchCreated(uint256 indexed matchId, address indexed player1, address indexed player2, uint256 stake);
    event ResultCommitted(uint256 indexed matchId, address indexed winner, uint256 reward);

    constructor(address _token) {
        gameToken = IERC20(_token);
        owner = msg.sender;
    }

    function createMatch(address player1, address player2, uint256 stakeAmount) external nonReentrant returns (uint256) {
        require(msg.sender == owner, "Only owner can create matches");
        require(stakeAmount > 0, "Stake must be > 0");

        // Transfer stakes from both players to this contract
        require(gameToken.transferFrom(player1, address(this), stakeAmount), "P1 transfer failed");
        require(gameToken.transferFrom(player2, address(this), stakeAmount), "P2 transfer failed");

        matchCounter++;
        matches[matchCounter] = Match({
            player1: player1,
            player2: player2,
            stakeAmount: stakeAmount,
            winner: address(0),
            isComplete: false
        });

        emit MatchCreated(matchCounter, player1, player2, stakeAmount);
        return matchCounter;
    }

    function commitResult(uint256 matchId, address winner) external nonReentrant {
        require(msg.sender == owner, "Only owner can commit results");
        
        Match storage m = matches[matchId];
        require(!m.isComplete, "Result already committed");
        require(winner == m.player1 || winner == m.player2, "Winner must be a player");

        m.winner = winner;
        m.isComplete = true;

        uint256 reward = m.stakeAmount * 2;
        require(gameToken.transfer(winner, reward), "Reward transfer failed");

        emit ResultCommitted(matchId, winner, reward);
    }
}