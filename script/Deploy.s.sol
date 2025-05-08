// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {WorldWar} from "../src/WorldWar.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        WorldWar worldWar = new WorldWar(msg.sender);

        // Array of winners to test with
        string[10] memory winners = [
            "Alice",
            "Bob",
            "Charlie",
            "David",
            "Eve",
            "Frank",
            "Grace",
            "Heidi",
            "Ivan",
            "Judy"
        ];

        // Initial budget in wei (100 wei as per constructor)
        uint256 currentBudget = 100;

        // Call beat function 10 times with increasing budgets
        for (uint i = 0; i < 10; i++) {
            // Calculate new budget (110% of previous as per winningPercent)
            currentBudget = (currentBudget * 110) / 100;
            
            // Call beat function with new winner and budget
            worldWar.beat{value: currentBudget}(winners[i]);
        }

        vm.stopBroadcast();
    }
} 