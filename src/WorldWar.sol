// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WorldWar is Ownable {

    // winner name or idea and budget
    string public currentWinner;
    uint256 public currentBudget;
    uint8 public constant winningPercent = 110;

    // Beneficiaries
    uint8 public constant partnerPercent = 10;
    address public partnerAddress;
    mapping (address => uint256) balances;

    event NewWinner(string newWinner, uint256 newBudget);

    constructor (address initialOwner) Ownable (initialOwner) {
        currentWinner = "God";
        currentBudget = 100 wei;
        emit NewWinner(currentWinner, currentBudget);
    }

    function beat(string memory newWinner) public payable {
        require(isSufficientBudget(msg.value));
        currentBudget = msg.value;
        currentWinner = newWinner;
        
        // beneficiaries
        uint256 partnerShare = msg.value * partnerPercent / 100;
        balances[partnerAddress] += partnerShare;
        balances[owner()] += msg.value - partnerShare; // TODO is this correct (check the way math is rounded)
        emit NewWinner(newWinner, msg.value);
    }
    function isSufficientBudget(uint256 newBudget) public view returns (bool) {
        return (newBudget >= currentBudget * winningPercent / 100);
    }

    function withdraw() public {
        require(payable(msg.sender).send(balances[msg.sender]), "Failed to send Ether");
    }

    modifier onlyPartner() {
        require(msg.sender == partnerAddress, "Must be partner!");
        _;
    }

    function setPartnerAddress(address payable newPartnerAddress) public onlyPartner {
        partnerAddress = newPartnerAddress;
    }
}