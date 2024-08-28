// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/WorldWar.sol";

contract WorldWarTest is Test {
    WorldWar public worldWar;

    function setUp() public {
        worldWar = new WorldWar();
    }

    function testInitialValues() public view {
        assertEq(worldWar.currentWinner(), "God");
        assertEq(worldWar.currentBudget(), 100 wei);
    }

    function testIsSufficientBudget() public view {
        uint256 budget = 200 wei;

        bool sufficient = worldWar.isSufficientBudget(budget);
        assertTrue(sufficient);
    }
    function testIsInsufficientBudget() public view {
        uint256 insufficientBudget = 10 wei; // Less than 10% of 10 wei

        bool insufficient = worldWar.isSufficientBudget(insufficientBudget);
        assertFalse(insufficient);
    }

    function testBeatFunctionWithSufficientBudget() public {
        string memory newWinner = "Humanity";
        uint256 newBudget = 200 wei; // Must be at least 10% more than the current budget (1 wei)

        worldWar.beat{value: newBudget}(newWinner);

        assertEq(worldWar.currentWinner(), newWinner);
        assertEq(worldWar.currentBudget(), newBudget);
    }

    function testBeatFunctionWithInsufficientBudget() public {
        string memory newWinner = "Aliens";
        uint256 newBudget = 100 wei; // Not enough to beat the current budget of 1 wei

        vm.expectRevert(); // Expect the transaction to revert
        worldWar.beat{value: newBudget}(newWinner);
    }
}   
