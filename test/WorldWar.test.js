const { expect } = require("chai");
const { ethers } = require("hardhat");

const INITIAL_BUDGET = ethers.parseEther("0.0003");

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
      expect(await worldWar.currentBudget()).to.equal(INITIAL_BUDGET);
    });
  });

  describe("Beat function", function () {
    it("Should fail if budget is insufficient", async function () {
      await expect(
        worldWar.connect(user1).beat("New Winner", { value: 50 })
      ).to.be.revertedWith("Insufficient budget");
    });

    it("Should update winner and budget with sufficient funds", async function () {
      const newBudget = INITIAL_BUDGET * 110n / 100n;
      await worldWar.connect(user1).beat("New Winner", { value: newBudget });
      expect(await worldWar.currentWinner()).to.equal("New Winner");
      expect(await worldWar.currentBudget()).to.equal(newBudget);
    });

    it("Should emit NewWinner event", async function () {
      const newBudget = INITIAL_BUDGET * 110n / 100n;
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
      const beatAmount = INITIAL_BUDGET * 110n / 100n;
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
      // 110% of INITIAL_BUDGET
      const sufficient = INITIAL_BUDGET * 110n / 100n;
      const insufficient = sufficient - 1n;
      expect(await worldWar.isSufficientBudget(sufficient)).to.be.true;
      expect(await worldWar.isSufficientBudget(insufficient)).to.be.false;
    });
  });

  describe("Multiple consecutive beat calls", function () {
    it("Should handle multiple consecutive beat calls with increasing budgets", async function () {
      // Initial budget is 0.0003 ether
      let currentBudget = INITIAL_BUDGET;
      // First beat - needs 110% of currentBudget
      let nextBudget = currentBudget * 110n / 100n;
      await worldWar.connect(user1).beat("Winner 1", { value: nextBudget });
      expect(await worldWar.currentWinner()).to.equal("Winner 1");
      expect(await worldWar.currentBudget()).to.equal(nextBudget);
      // Second beat - needs 110% of nextBudget
      let nextBudget2 = nextBudget * 110n / 100n;
      await worldWar.connect(user2).beat("Winner 2", { value: nextBudget2 });
      expect(await worldWar.currentWinner()).to.equal("Winner 2");
      expect(await worldWar.currentBudget()).to.equal(nextBudget2);
      // Third beat - needs 110% of nextBudget2
      let nextBudget3 = nextBudget2 * 110n / 100n;
      await worldWar.connect(user1).beat("Winner 3", { value: nextBudget3 });
      expect(await worldWar.currentWinner()).to.equal("Winner 3");
      expect(await worldWar.currentBudget()).to.equal(nextBudget3);
    });

    it("Should fail if budget doesn't meet 110% requirement", async function () {
      // Initial budget is 0.0003 ether
      let currentBudget = INITIAL_BUDGET;
      let nextBudget = currentBudget * 110n / 100n;
      await worldWar.connect(user1).beat("Winner 1", { value: nextBudget });
      // Try to beat with insufficient budget (just below required)
      let insufficient = nextBudget * 110n / 100n - 1n;
      await expect(
        worldWar.connect(user2).beat("Winner 2", { value: insufficient })
      ).to.be.revertedWith("Insufficient budget");
    });
  });

  describe("Balance distribution", function () {
    it("Should correctly distribute funds between owner and partner", async function () {
      const beatAmount = INITIAL_BUDGET * 110n / 100n; // first valid beat
      // Get initial balances
      const ownerBalanceBefore = await worldWar.getBalance(owner.address);
      const partnerBalanceBefore = await worldWar.getBalance(partner.address);
      // Make a beat
      await worldWar.connect(user1).beat("New Winner", { value: beatAmount });
      // Check balances after distribution
      const ownerBalanceAfter = await worldWar.getBalance(owner.address);
      const partnerBalanceAfter = await worldWar.getBalance(partner.address);
      // Partner should get 1%
      const expectedPartner = beatAmount / 100n;
      // Owner should get 99%
      const expectedOwner = beatAmount - expectedPartner;
      expect(partnerBalanceAfter - partnerBalanceBefore).to.equal(expectedPartner);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedOwner);
    });

    it("Should handle multiple transactions and accumulate balances correctly", async function () {
      // First beat
      const beat1 = INITIAL_BUDGET * 110n / 100n;
      await worldWar.connect(user1).beat("Winner 1", { value: beat1 });
      // Second beat
      const beat2 = beat1 * 110n / 100n;
      await worldWar.connect(user2).beat("Winner 2", { value: beat2 });
      // Check accumulated balances
      const ownerBalance = await worldWar.getBalance(owner.address);
      const partnerBalance = await worldWar.getBalance(partner.address);
      // Partner should have: 1% of beat1 + 1% of beat2
      const expectedPartner = beat1 / 100n + beat2 / 100n;
      // Owner should have: 99% of beat1 + 99% of beat2
      const expectedOwner = (beat1 - beat1 / 100n) + (beat2 - beat2 / 100n);
      expect(partnerBalance).to.equal(expectedPartner);
      expect(ownerBalance).to.equal(expectedOwner);
    });
  });

  describe("Budget progression", function () {
    it("Should require exactly 110% of current budget for each new beat", async function () {
      let currentBudget = INITIAL_BUDGET;
      // Test the progression: 0.0003 -> 0.00033 -> 0.000363 -> ...
      const expectedBudgets = [currentBudget];
      for (let i = 1; i < 10; i++) {
        expectedBudgets.push(expectedBudgets[i-1] * 110n / 100n);
      }
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