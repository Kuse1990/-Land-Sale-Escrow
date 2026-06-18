// Import Chai assertion library
// Used to verify that expected results are correct
const { expect } = require("chai");

// Import Ethers.js from Hardhat
// Used to deploy and interact with smart contracts
const { ethers } = require("hardhat");

// Test suite for the LandSaleEscrow contract
describe("LandSaleEscrow", function () {

  // Variables accessible throughout the test suite
  let contract;
  let registrar;
  let seller;
  let buyer;

  // Runs before every test case
  beforeEach(async function () {

    // Get three test accounts from Hardhat
    // registrar = contract deployer/admin
    // seller = land owner
    // buyer = person purchasing land
    [registrar, seller, buyer] =
      await ethers.getSigners();

    // Get the contract factory
    // A factory is used to deploy contract instances
    const LandSaleEscrow =
      await ethers.getContractFactory(
        "LandSaleEscrow"
      );

    // Deploy a fresh contract before each test
    contract =
      await LandSaleEscrow.deploy();

    // Display account information
    console.log("\n=================================");
    console.log("Contract deployed");
    console.log("Registrar:", registrar.address);
    console.log("Seller:", seller.address);
    console.log("Buyer:", buyer.address);
    console.log("=================================\n");
  });

  // Test Case 1:
  // Verify that land registration works correctly
  it("Should register land", async function () {

    console.log("Registering Land...");

    // Seller registers a new land
    await contract.connect(seller)
      .registerLand(
        "Musanze",                 // land location
        500,                       // land area
        ethers.parseEther("1")     // price = 1 ETH
      );

    // Retrieve land information using Land ID = 1
    const land = await contract.getLand(1);

    // Display stored land information
    console.log("\nLAND DETAILS");
    console.log("------------------------");
    console.log("Land ID:", land.landId.toString());
    console.log("Location:", land.location);
    console.log("Area:", land.area.toString());
    console.log("Owner:", land.owner);

    // Convert Wei to ETH for readability
    console.log(
      "Price:",
      ethers.formatEther(land.price),
      "ETH"
    );

    console.log("For Sale:", land.forSale);
    console.log("------------------------\n");

    // Verify that seller became the owner
    expect(land.owner)
      .to.equal(seller.address);
  });

  // Test Case 2:
  // Verify complete escrow workflow
  it("Should complete land sale", async function () {

    console.log("\nSTEP 1: Register Land");

    // Seller registers a land
    await contract.connect(seller)
      .registerLand(
        "Musanze",
        500,
        ethers.parseEther("1")
      );

    // Read registered land information
    let land = await contract.getLand(1);

    console.log("Current Owner:", land.owner);

    console.log("\nSTEP 2: List Land For Sale");

    // Seller lists land for sale
    await contract.connect(seller)
      .listLandForSale(
        1,                         // land ID
        ethers.parseEther("1")     // selling price
      );

    // Read updated land information
    land = await contract.getLand(1);

    console.log("For Sale:", land.forSale);

    console.log(
      "Price:",
      ethers.formatEther(land.price),
      "ETH"
    );

    console.log("\nSTEP 3: Buyer Purchases Land");

    // Buyer deposits 1 ETH into escrow
    await contract.connect(buyer)
      .buyLand(
        1,
        {
          // ETH sent with transaction
          value:
          ethers.parseEther("1")
        }
      );

    // Retrieve sale information
    const sale =
      await contract.getSale(1);

    console.log("\nSALE DETAILS");
    console.log("------------------------");

    // Seller address
    console.log("Seller:", sale.seller);

    // Buyer address
    console.log("Buyer:", sale.buyer);

    // Display amount paid
    console.log(
      "Amount Paid:",
      ethers.formatEther(
        sale.amountPaid
      ),
      "ETH"
    );

    // Sale approval status
    console.log("Approved:", sale.approved);

    // Sale completion status
    console.log("Completed:", sale.completed);

    console.log("------------------------");

    console.log("\nSTEP 4: Registrar Approves Sale");

    // Registrar approves the sale
    // Ownership transfers to buyer
    // Payment is released to seller
    await contract.approveSale(1);

    // Retrieve updated land details
    land = await contract.getLand(1);

    console.log("\nUPDATED LAND DETAILS");
    console.log("------------------------");

    console.log(
      "Land ID:",
      land.landId.toString()
    );

    console.log(
      "Location:",
      land.location
    );

    console.log(
      "Area:",
      land.area.toString()
    );

    // New owner should be buyer
    console.log(
      "New Owner:",
      land.owner
    );

    console.log(
      "Price:",
      ethers.formatEther(
        land.price
      ),
      "ETH"
    );

    console.log(
      "For Sale:",
      land.forSale
    );

    console.log("------------------------");

    // Get total completed transactions
    const txCount =
      await contract.getTransactionCount();

    console.log(
      "\nTransaction History Count:",
      txCount.toString()
    );

    // Verify ownership was transferred
    expect(
      land.owner
    ).to.equal(buyer.address);
  });

});