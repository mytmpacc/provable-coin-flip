import React from 'react';
import './App.css';

import CoinFlipProvableJSON from './build/contracts/CoinFlipProvable.json';
import Web3 from 'web3';
import { contractAddress } from './build/contractAddress';

console.log('contractAddress', contractAddress);

var web3 = new Web3(Web3.givenProvider);

class App extends React.Component {
  state = {
    price: '',
    contract: null,
    contractBalance: '',
    payout: '',
    win: null, 
    waiting: null
  };

  async componentDidMount() {
    if (!window.ethereum) {
      return alert('Install metamask');
    }

    let accounts = await window.ethereum.enable();
    let contract = new web3.eth.Contract(CoinFlipProvableJSON.abi, contractAddress, { from: accounts[0] });

    this.setState({ contract, accounts });

    contract.events.NewBet((...args) => {
      console.log('event NewBet', args);
    })

    await Promise.all([this.fetchBalances(), this.checkBet()]);
  }

  fetchBalances = async () => {
    let contractBalance = await web3.eth.getBalance(contractAddress);
    contractBalance = web3.utils.fromWei(contractBalance, 'ether');
    console.log('balance => ', contractBalance);

    let account = this.state.accounts[0];
    let accountBalance = await web3.eth.getBalance(account);
    accountBalance = web3.utils.fromWei(accountBalance, 'ether');
    console.log('accountBalance => ', accountBalance);

    this.setState({ contractBalance, accountBalance });
  };

  checkBet = async () => {
    let { contract, accounts } = this.state;
    let res = await contract.methods.checkBet().call({ from: accounts[0] });
    console.log('res', res);
    let { 0: waiting, 1: win, 2: wei } = res;
    let payout = web3.utils.fromWei(wei, 'ether');
    console.log('payout', payout);
    this.setState({ payout, win, waiting });
  };

  render() {
    let submitBet = async e => {
      console.log('web3', web3);
      let { contract, accounts } = this.state;
      let price = web3.utils.toWei(this.state.price, 'ether');
      let promiEvent = contract.methods.commitBet().send({ from: accounts[0], value: price });
      promiEvent.on('transactionHash', (...args) => { console.log('transactionHash', args); })
      promiEvent.on('confirmation', (...args) => { console.log('confirmation', args); })
      promiEvent.on('receipt', (...args) => { console.log('receipt', args); })
      await promiEvent;
      await Promise.all([this.fetchBalances(), this.checkBet()]);
    };

    let withdraw = async e => {
      console.log('web3', web3);
      let { contract, accounts } = this.state;
      let res = await contract.methods.withdraw().send({ from: accounts[0] });
      console.log('withdraw res', res);
      await Promise.all([this.fetchBalances(), this.checkBet()]);
    };

    let handleChange = e => {
      let price = e.target.value;
      this.setState({ price });
    };
    let { contractBalance, accountBalance, payout, waiting } = this.state;

    return (
      <div className="app">
        <div>{waiting && `Waiting for your incomplete bet...`}</div>
        <div>{contractBalance && `Contract balance: ${contractBalance} ETH`}</div>
        <div>{accountBalance && `Account balance: ${accountBalance} ETH`}</div>
        <div>{payout && `Allow to withdraw: ${payout} ETH`}</div>
        {!waiting && <div className='submit-box'>
          <input type='text' onChange={handleChange} />
          <button onClick={submitBet}>Submit bet</button>
        </div>}
        <div><button onClick={this.checkBet}>Check bet</button></div>
        <div><button onClick={withdraw}>Withdraw</button></div>
      </div>
    );
  }
}

export default App;
