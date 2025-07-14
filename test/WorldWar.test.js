const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorldWar", function () {
  let worldWar;
  let owner;
  let partner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, partner, user1, user2] = await ethers.getSigners();
    
    const WorldWar = await ethers.getContractFactory("WorldWar");
    worldWar = await WorldWar.deploy(owner.address, partner.address);
    await worldWar.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await worldWar.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct values", async function () {
      expect(await worldWar.currentWinner()).to.equal("God");
      expect(await worldWar.currentBudget()).to.equal(100);
    });
  });

  describe("Beat function", function () {
    it("Should fail if budget is insufficient", async function () {
      await expect(
        worldWar.connect(user1).beat("New Winner", { value: 50 })
      ).to.be.revertedWith("Insufficient budget");
    });

    it("Should update winner and budget with sufficient funds", async function () {
      const newBudget = 120; // 110% of current budget
      await worldWar.connect(user1).beat("New Winner", { value: newBudget });
      
      expect(await worldWar.currentWinner()).to.equal("New Winner");
      expect(await worldWar.currentBudget()).to.equal(newBudget);
    });

    it("Should emit NewWinner event", async function () {
      const newBudget = 120;
      await expect(worldWar.connect(user1).beat("New Winner", { value: newBudget }))
        .to.emit(worldWar, "NewWinner")
        .withArgs("New Winner", newBudget);
    });
  });

  describe("Partner functionality", function () {
    it("Should allow partner to set new partner address", async function () {
      await worldWar.connect(partner).setPartnerAddress(user1.address);
      expect(await worldWar.partnerAddress()).to.equal(user1.address);
    });

    it("Should fail if non-authorized user tries to set partner address", async function () {
      await expect(
        worldWar.connect(user1).setPartnerAddress(user2.address)
      ).to.be.revertedWith("Must be partner!");
    });
  });

  describe("Withdrawal functionality", function () {
    it("Should allow users to withdraw their balance", async function () {
      // Make a beat to generate some balance for partner
      const beatAmount = ethers.parseEther("1.0");
      await worldWar.connect(user1).beat("New Winner", { value: beatAmount });
      
      // Get partner's balance before withdrawal
      const balanceBefore = await worldWar.getBalance(partner.address);
      
      // Withdraw partner's share
      await worldWar.connect(partner).withdraw();
      
      // Check that balance is now 0
      const balanceAfter = await worldWar.getBalance(partner.address);
      expect(balanceAfter).to.equal(0);
      expect(balanceBefore).to.be.gt(0);
    });

    it("Should fail withdrawal if balance is zero", async function () {
      await expect(
        worldWar.connect(user2).withdraw()
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Budget calculations", function () {
    it("Should correctly calculate winning percentage", async function () {
      expect(await worldWar.isSufficientBudget(110)).to.be.true;
      expect(await worldWar.isSufficientBudget(109)).to.be.false;
    });
  });

  describe("Multiple consecutive beat calls", function () {
    it("Should handle multiple consecutive beat calls with increasing budgets", async function () {
      // Initial budget is 100 wei
      let currentBudget = 100;
      
      // First beat - needs 110 wei (110% of 100)
      await worldWar.connect(user1).beat("Winner 1", { value: 110 });
      expect(await worldWar.currentWinner()).to.equal("Winner 1");
      expect(await worldWar.currentBudget()).to.equal(110);
      
      // Second beat - needs 121 wei (110% of 110)
      await worldWar.connect(user2).beat("Winner 2", { value: 121 });
      expect(await worldWar.currentWinner()).to.equal("Winner 2");
      expect(await worldWar.currentBudget()).to.equal(121);
      
      // Third beat - needs 133 wei (110% of 121, rounded down)
      await worldWar.connect(user1).beat("Winner 3", { value: 133 });
      expect(await worldWar.currentWinner()).to.equal("Winner 3");
      expect(await worldWar.currentBudget()).to.equal(133);
    });

    it("Should fail if budget doesn't meet 110% requirement", async function () {
      // Initial budget is 100 wei
      await worldWar.connect(user1).beat("Winner 1", { value: 110 });
      
      // Try to beat with insufficient budget (120 instead of 121)
      await expect(
        worldWar.connect(user2).beat("Winner 2", { value: 120 })
      ).to.be.revertedWith("Insufficient budget");
    });
  });

  describe("Balance distribution", function () {
    it("Should correctly distribute funds between owner and partner", async function () {
      const beatAmount = 1000; // 1000 wei
      
      // Get initial balances
      const ownerBalanceBefore = await worldWar.getBalance(owner.address);
      const partnerBalanceBefore = await worldWar.getBalance(partner.address);
      
      // Make a beat
      await worldWar.connect(user1).beat("New Winner", { value: beatAmount });
      
      // Check balances after distribution
      const ownerBalanceAfter = await worldWar.getBalance(owner.address);
      const partnerBalanceAfter = await worldWar.getBalance(partner.address);
      
      // Partner should get 1% (10 wei)
      expect(partnerBalanceAfter - partnerBalanceBefore).to.equal(10);
      // Owner should get 99% (990 wei)
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(990);
    });

    it("Should handle multiple transactions and accumulate balances correctly", async function () {
      // First beat
      await worldWar.connect(user1).beat("Winner 1", { value: 110 });
      
      // Second beat
      await worldWar.connect(user2).beat("Winner 2", { value: 121 });
      
      // Check accumulated balances
      const ownerBalance = await worldWar.getBalance(owner.address);
      const partnerBalance = await worldWar.getBalance(partner.address);
      
      // Partner should have: 1% of 110 + 1% of 121 = 1.1 + 1.21 = 2.31 (rounded down to 2)
      expect(partnerBalance).to.equal(2);
      // Owner should have: 99% of 110 + 99% of 121 = 108.9 + 119.79 = 228.69 (rounded down to 229)
      expect(ownerBalance).to.equal(229);
    });
  });

  describe("Budget progression", function () {
    it("Should require exactly 110% of current budget for each new beat", async function () {
      let currentBudget = 100;
      
      // Test the progression: 100 -> 110 -> 121 -> 133 -> 146 -> 160 -> 176 -> 193 -> 212 -> 233
      const expectedBudgets = [100, 110, 121, 133, 146, 160, 176, 193, 212, 233];
      
      for (let i = 0; i < expectedBudgets.length; i++) {
        if (i === 0) {
          // Initial state
          expect(await worldWar.currentBudget()).to.equal(expectedBudgets[i]);
        } else {
          // Beat with the required amount
          await worldWar.connect(user1).beat(`Winner ${i}`, { value: expectedBudgets[i] });
          expect(await worldWar.currentBudget()).to.equal(expectedBudgets[i]);
        }
      }
    });

  });
}); 