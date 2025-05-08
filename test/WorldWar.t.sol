// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/WorldWar.sol";

contract WorldWarTest is Test {
    WorldWar public worldWar;
    address payable defaultOwner = payable(0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97);

    function setUp() public {
        worldWar = new WorldWar(defaultOwner);
    }

    function testInitialValues() public view {
        assertEq(worldWar.currentWinner(), "God");
        assertEq(worldWar.currentBudget(), 100 wei);
    }

    function testIsSufficientBudget() public view {
        uint256 budget = 110 wei; // 10% more than current budget
        bool sufficient = worldWar.isSufficientBudget(budget);
        assertTrue(sufficient);
    }

    function testIsInsufficientBudget() public view {
        uint256 insufficientBudget = 109 wei; // Less than 10% more than current budget
        bool insufficient = worldWar.isSufficientBudget(insufficientBudget);
        assertFalse(insufficient);
    }

    function testBeatFunctionWithSufficientBudget() public {
        string memory newWinner = "Humanity";
        uint256 newBudget = 200 wei; // More than 10% of current budget

        worldWar.beat{value: newBudget}(newWinner);

        assertEq(worldWar.currentWinner(), newWinner);
        assertEq(worldWar.currentBudget(), newBudget);
    }

    function testBeatFunctionWithInsufficientBudget() public {
        string memory newWinner = "Aliens";
        uint256 insufficientBudget = 109 wei; // Less than 10% more than current budget

        vm.expectRevert("Insufficient budget"); // Expect specific revert message
        worldWar.beat{value: insufficientBudget}(newWinner);
    }
}   
