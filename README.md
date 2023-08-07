<h2>COINFLIP MINIGAME<h2>

THE SOLIDITY PART
The gameplay smart contract is a coinflip minigame platform. The smart contract stores available games, games in progress, and finished games. The user is be able to deposit or withdraw money from the contract. The balance of each user is being stored in mappings. The games are stored in arrays. The user is able to create a game and cancel it. The user is also be able to join a game, which starts a game between the player and a randomly allocated address that created the game with the same bet amount. The funds are meanwhile transfered to deployer wallet, which in the end, sends the funds to the winner (minus game fee). If a player cancels the created game, he gets all the funds back. The game is then performed with help of vrf which gets back 7 random values, which are used for 7 games that the players play (7 coinflips). First to get to 4 wins, wins the game. Each coin flip is added in events for front end to process separately and make an exciting gameplay. The nft gamecoins is a nft made specificaly for this game. It stores the data about wins, losses, and pnl as an interesting touch for the player base. The nft contract needs to approve the coinflip minigame address to change the players stats, in case in future there is another contract that will be able to change these stats. The address who wants to access the create game and join game function needs to have a gamecoins nft. The gamecoins nft address needs to be set when we deploy the gameplay contract in the deploy script. Each player can only have one gamecoin, because there could be a possibility to get perks if certain amount of wins/losses/amount is farmed. That's what would bring value to the nft.

HOW TO START

1. Deploy the contract gamecoins (hardhat deploy --tags gamecoins --networks sepolia)
2. Take gamecoins address and paste it in gameplay deploy script (in 02-deploy-GameCoins.js) (hardhat deploy --tags coinflip)
3. After deploying both successfuly, add gameplay address to vrf service (https://vrf.chain.link)
4. Run script addContract (hardhat run scripts/AddContract.js --network sepolia) - To add gameplay to a gamecoins contract
5. Update front-end variables in contractAddresses, abi, abiNFT, and contractAddressesNFT(it should update when you deploy the contracts)
6. That's it, enjoy the coinflip minigame!!
