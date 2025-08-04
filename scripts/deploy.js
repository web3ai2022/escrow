// scripts/deploy.js
const hre = require("hardhat");

async function main() {
    const [buyer, seller, arbitrator] = await hre.ethers.getSigners();

    // 获取Escrow合约工厂并部署
    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(seller.address, arbitrator.address);
    await escrow.deployed();

    console.log("Escrow contract deployed to:", escrow.address);
    console.log("Buyer:", buyer.address);
    console.log("Seller:", seller.address);
    console.log("Arbitrator:", arbitrator.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });