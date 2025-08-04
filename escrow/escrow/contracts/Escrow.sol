// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbitrator;
    uint public amount;
    bool public itemSent;
    bool public itemReceived;

    constructor(address _seller, address _arbitrator) {
        buyer = msg.sender;
        seller = _seller;
        arbitrator = _arbitrator;
    }

    function deposit() public payable {
        require(msg.sender == buyer, "Only buyer can deposit");
        require(amount == 0, "Amount already deposited");
        amount = msg.value;
    }

    function sent() public {
        require(msg.sender == seller, "Only seller can confirm sent");
        itemSent = true;
    }

    function confirmReceipt() public {
        require(itemSent == true && msg.sender == buyer, "Only buyer can confirm receipt");
        itemReceived = true;
    }

    function releaseFunds() public {
        require(itemReceived || msg.sender == arbitrator, "Conditions not met for release");
        payable(seller).transfer(amount);
    }

    function refund() public {
        require(msg.sender == arbitrator || (msg.sender == buyer && !itemReceived), "Conditions not met for refund");
        payable(buyer).transfer(amount);
    }
}