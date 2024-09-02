// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract WorldWar {

    // winner name or idea and budget
    string public currentWinner;
    uint256 public currentBudget;
    uint8 public constant winningPercent = 110;

    // Beneficiaries
    uint8 public constant partnerPercent = 10;
    uint256 public partnerBalance;
    uint256 public ownerBalance;
    address public partnerAddress;

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
        partnerBalance += msg.value * partnerPercent / 100;
        ownerBalance += msg.value - partnerBalance; 
    }
    function isSufficientBudget(uint256 newBudget) public view returns (bool) {
        return (newBudget >= currentBudget * winningPercent / 100);
    }

    function withdrawOnwer

    function changePartnerAddress(address newPartnerAddress) {

    }
}