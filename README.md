COINFLIP MINIGAME 

THE GAME
It will be done in js, nothing crazy. But it will call the funtions from the contract. 
The logic of nfts, trackers, bets will be done in solidity.

THE SOLIDITY PART
The gameplay smart contract is a coinflip minigame platform. The smart contract will store available games, games in progress, and finished games. The user will be able to deposit or withdraw money from the contract. The balance of each user will be stored in mappings. The games will be stored in arrays. The user will be able to create a game and cancel it. The user will also be able to join a game which will start a game between the player and randomly allocated player that created the game with the same amount. The funds are meanwhile transfered to deployer wallet, which send's the funds-fee to the winner of each game. If player cancels the created game he gets all the funds back to him. The game is then performed with help of vrf which gets back 7 randomvalues, which are used for 7 games that the players play. First to get to 4 wins, wins the game. Added in events for front end to process each coin flip separately and make an exciting gameplay with coin flips.

CHAINLINK IMPLEMENTATION - VRF




