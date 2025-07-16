// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WorldWar is Ownable {

    // winner name or idea and budget
    string public currentWinner;
    uint256 public currentBudget;
    uint8 public constant winningPercent = 110;

    // Beneficiaries
    uint8 public constant partnerPercent = 1;
    address public partnerAddress;
    mapping (address => uint256) balances;

    event NewWinner(string newWinner, uint256 newBudget);

    constructor (address initialOwner, address initialPartnerAddress) Ownable (initialOwner) {
        currentWinner = "God";
        currentBudget = 0.0003 ether;
        partnerAddress = initialPartnerAddress;
        emit NewWinner(currentWinner, currentBudget);
    }

    function beat(string memory newWinner) public payable {
        require(isSufficientBudget(msg.value), "Insufficient budget");
        currentBudget = msg.value;
        currentWinner = newWinner;
        
        // beneficiaries
        uint256 partnerShare = msg.value * partnerPercent / 100;
        balances[partnerAddress] += partnerShare;
        balances[owner()] += msg.value - partnerShare;
        emit NewWinner(newWinner, msg.value);
    }

    function isSufficientBudget(uint256 newBudget) public view returns (bool) {
        return (newBudget >= currentBudget * winningPercent / 100);
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        balances[msg.sender] = 0;
        require(payable(msg.sender).send(amount), "Failed to send Ether");
    }

    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }

    modifier onlyPartner() {
        require(msg.sender == partnerAddress, "Must be partner!");
        _;
    }

    function setPartnerAddress(address payable newPartnerAddress) onlyPartner public {
        require(newPartnerAddress != address(0), "Invalid partner address");
        partnerAddress = newPartnerAddress;
    }
}