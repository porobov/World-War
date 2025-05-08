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
}); 