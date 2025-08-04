const { expect } = require("chai");
const { ethers} = require("hardhat");

describe("Escrow Contract", function () {
    let Escrow, escrow, buyer, seller, arbitrator;
    const depositAmount = ethers.utils.parseEther("1");

    beforeEach(async function () {
        // 获取测试地址
        [buyer, seller, arbitrator] = await ethers.getSigners();

        // 部署Escrow合约
        Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(seller.address, arbitrator.address);
        await escrow.deployed();
    });

    it("正确设置了buyer, seller, and arbitrator", async function () {
        expect(await escrow.buyer()).to.equal(buyer.address);
        expect(await escrow.seller()).to.equal(seller.address);
        expect(await escrow.arbitrator()).to.equal(arbitrator.address);
    });

    it("允许buyer去支付", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        expect(await escrow.amount()).to.equal(depositAmount);
    });

    it("仅允许buyer支付一次", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await expect(
            escrow.connect(buyer).deposit({ value: depositAmount })
        ).to.be.revertedWith("Amount already deposited");
    });

    it("仅允许buyer去确认收货", async function () {
        await expect(escrow.connect(seller).confirmReceipt()).to.be.revertedWith("Only buyer can confirm receipt");
        await escrow.connect(seller).sent();
        await escrow.connect(buyer).confirmReceipt();
        expect(await escrow.itemReceived()).to.equal(true);
    });

    it("允许arbitrator或buyer去确认支付", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await escrow.connect(seller).sent();
        await escrow.connect(buyer).confirmReceipt();
        await escrow.connect(arbitrator).releaseFunds();

        const sellerBalance = await ethers.provider.getBalance(seller.address);
        expect(sellerBalance).to.be.above(depositAmount);
    });

    it("如果不满足支付条件，不确认支付给seller", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await expect(
            escrow.connect(seller).releaseFunds()
        ).to.be.revertedWith("Conditions not met for release");
    });

    it("允许arbitrator退款给 buyer", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await escrow.connect(arbitrator).refund();

        const buyerBalance = await ethers.provider.getBalance(buyer.address);
        expect(buyerBalance).to.be.above(depositAmount);
    });

    it("不允许其他地址去退款", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await escrow.connect(seller).sent();
        await escrow.connect(buyer).confirmReceipt();

        await expect(escrow.connect(seller).refund()).to.be.revertedWith(
            "Conditions not met for refund"
        );
    });

    it("如果收到货，buyer不可以退款", async function () {
        await escrow.connect(buyer).deposit({ value: depositAmount });
        await escrow.connect(seller).sent();
        await escrow.connect(buyer).confirmReceipt();
        //已经收到了，就不能退了
        await expect(escrow.connect(buyer).refund()).to.be.revertedWith(
            "Conditions not met for refund"
        );
    });
});