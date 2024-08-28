// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract WorldWar {
    string public currentWinner;
    uint256 public currentBudget;
    uint8 public constant percent = 110;

    event NewWinner(string newWinner, uint256 newBudget);

    constructor () {
        currentWinner = "God";
        currentBudget = 100 wei;
        emit NewWinner(currentWinner, currentBudget);
    }

    function beat(string memory newWinner) public payable {
        require(isSufficientBudget(msg.value));
        currentBudget = msg.value;
        currentWinner = newWinner;
        emit NewWinner(newWinner, msg.value);
    }
    function isSufficientBudget(uint256 newBudget) public view returns (bool) {
        return (newBudget >= currentBudget * percent / 100);
    }
}