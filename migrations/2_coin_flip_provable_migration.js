const CoinFlipProvable = artifacts.require("CoinFlipProvable");
const fs = require('fs');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(CoinFlipProvable).then(async contract => {
    let tx = await web3.eth.sendTransaction({ from: accounts[0], to: contract.address, value: web3.utils.toWei('0.01', 'ether') });
    console.log('tx => ', tx);
    fs.writeFileSync("./build/contractAddress.js", `export const contractAddress = "${contract.address}"`);
  });
};
