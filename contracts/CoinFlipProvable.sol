import './provableAPI_0.6.sol';

pragma solidity > 0.6.1 < 0.7.0;

contract CoinFlipProvable is usingProvable {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    struct Bet {
        bool waiting;
        bool win;
        uint value; // to payout
    }

    uint public balance;
    mapping(address => Bet) public bets;
    mapping(bytes32 => address payable) public randomQueries;

    event NewBet(address indexed player, bool win, uint value);

    function __callback(bytes32 queryId, string memory result) public override {
        require(msg.sender == provable_cbAddress());
        address payable player = randomQueries[queryId];
        bool random = uint(keccak256(abi.encodePacked(result))) % 2 == 1;
        Bet storage bet = bets[player];
        bet.win = random;
        bet.waiting = false;
        emit NewBet(player, random, bet.value);
    }

    function commitBet() public payable {
        require(msg.value * 2 <= balance, "Contract do not have balance for this bet");
        Bet storage bet = bets[msg.sender];
        require(!bet.waiting, 'Wait for a previous bet result');
        bet.value = msg.value * 2;
        bet.waiting = true;
        bytes32 queryId = provable_newRandomDSQuery(0, 1, 200000);
        randomQueries[queryId] = msg.sender;
    }

    function checkBet() public view returns (bool, bool, uint) {
        Bet memory bet = bets[msg.sender];
        return (bet.waiting, bet.win, bet.value);
    }

    function withdraw() public {
        Bet storage bet = bets[msg.sender];
        require(bet.win && bet.value > 0, "Done! Nothing to withdraw");
        uint value = bet.value;
        bet.value = 0;
        msg.sender.transfer(value);
    }

    fallback() external payable {
        balance += msg.value;
    }

    receive() external payable {
        balance += msg.value;
    }
}