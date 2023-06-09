const { expect, assert } = require("chai")
const { deployments, ethers, network, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { config } = require("dotenv")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Coinflip test", function () {
          let coinflip, VRF, deployer, player, player2
          const depositAmount = ethers.utils.parseEther("10")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              accounts = await ethers.getSigners()
              player = accounts[1]
              player2 = accounts[2]
              await deployments.fixture(["all"])
              coinflip = await ethers.getContract("Gameplay", deployer)
              VRF = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
          })

          describe("deposit, withdraw and _transfer", function () {
              let PlayerConnected
              beforeEach(async function () {
                  PlayerConnected = await coinflip.connect(player)
                  await PlayerConnected.deposit({ value: depositAmount })
              })
              it("increases balance of the player", async () => {
                  const getBalance = await PlayerConnected.balanceOf(player.address)
                  assert.equal(getBalance.toString(), depositAmount.toString())
              })
              it("withdraws", async () => {
                  await PlayerConnected.withdraw(depositAmount)
                  const getBalance = await PlayerConnected.balanceOf(player.address)
                  assert.equal(getBalance.toString(), 0)
              })
              it("withdrawing too much", async () => {
                  Amount = ethers.utils.parseEther("50")
                  await expect(PlayerConnected.withdraw(Amount)).to.be.revertedWith(
                      "CoinFlip_notEnoughFunds"
                  )
              })
          })
          describe("CreateGame and cancel game", function () {
              let PlayerConnected
              beforeEach(async function () {
                  PlayerConnected = await coinflip.connect(player)
                  await PlayerConnected.deposit({ value: depositAmount })
              })
              it("Creates a games", async () => {
                  await PlayerConnected.startGame(depositAmount, 0) // 0 -> heads, 1 -> tails
                  const availableGames = await PlayerConnected.allAvailableGames()
                  assert.equal(availableGames.toString(), 1)
              })
              it("Error if amout too low", async () => {
                  const amountToStart = ethers.utils.parseEther("0.05")
                  await expect(PlayerConnected.startGame(amountToStart, 0)).to.be.revertedWith(
                      "CoinFlip_betAmountTooLow"
                  )
              })
              it("Error if balance is not sufficient for entering amount", async () => {
                  const highAmount = ethers.utils.parseEther("50")
                  await expect(PlayerConnected.startGame(highAmount, 0)).to.be.revertedWith(
                      "CoinFlip_notEnoughFunds"
                  )
              })
              it("Balance of the player changes", async () => {
                  await PlayerConnected.startGame(depositAmount, 0)
                  const getBalance = await PlayerConnected.balanceOf(player.address)
                  assert.equal(getBalance.toString(), 0)
              })
              it("Cancels the game", async () => {
                  const gameId = PlayerConnected.viewGameNumber()
                  await PlayerConnected.startGame(depositAmount, 0)
                  await PlayerConnected.cancelGame(0)
                  const availableGames = await PlayerConnected.allAvailableGames()
                  assert.equal(availableGames.toString(), 0)
              })
              it("Give back the funds", async () => {
                  await PlayerConnected.startGame(depositAmount, 0)
                  await PlayerConnected.cancelGame(0)
                  const returnedAmout = await PlayerConnected.balanceOf(player.address)
                  assert.equal(depositAmount.toString(), returnedAmout.toString())
              })
              it("Give error if the address doesn't match the creator of the game", async () => {
                  await PlayerConnected.startGame(depositAmount, 0)
                  await expect(coinflip.cancelGame(0)).to.be.revertedWith(
                      "CoinFlip_incorrectAddress"
                  )
              })
          })
          describe("Joins the game and executes the gameplay", async () => {
              let PlayerConnected
              beforeEach(async function () {
                  PlayerConnected = coinflip.connect(player)
                  await PlayerConnected.deposit({ value: depositAmount })
                  await PlayerConnected.startGame(depositAmount, 0)
              })
              it("throws an error if bet amount to low", async () => {
                  const amountToStart = ethers.utils.parseEther("0.05")
                  await expect(PlayerConnected.joinGame(amountToStart)).to.be.revertedWith(
                      "CoinFlip_betAmountTooLow"
                  )
              })
              it("throws an error if player doesn't have enough funds", async () => {
                  const amountToStart = ethers.utils.parseEther("50")
                  await expect(PlayerConnected.joinGame(amountToStart)).to.be.revertedWith(
                      "CoinFlip_notEnoughFunds"
                  )
              })
              it("throws an error if none of the games are available with selected amount", async () => {
                  const customAmount = ethers.utils.parseEther("5")
                  await coinflip.deposit({ value: depositAmount })
                  await expect(coinflip.joinGame(customAmount)).to.be.revertedWith(
                      "CoinFlip_noGameFoundWithThisAmount"
                  )
              })
              it("AvailableGames array lenght decreases, GamesInProgress array lenght increases", async () => {
                  await coinflip.deposit({ value: depositAmount })
                  await coinflip.joinGame(depositAmount)
                  const availableGames = await coinflip.allAvailableGames()
                  const GamesInProgress = await coinflip.allGamesInProgress()
                  assert.equal(availableGames.toString(), 0)
                  assert.equal(GamesInProgress.toString(), 1)
              })
              it("Transfered funds to gameOwner", async () => {
                  const Player2Connected = coinflip.connect(player2)
                  await Player2Connected.deposit({ value: depositAmount })
                  await Player2Connected.joinGame(depositAmount)
                  const ownerBalance = await coinflip.balanceOf(deployer)
                  assert.equal(ownerBalance.toString(), 2 * depositAmount)
              })
              it("Executes fulfill random words", async () => {
                  const Player2Connected = coinflip.connect(player2)
                  await Player2Connected.deposit({ value: depositAmount })
                  const tx = await Player2Connected.joinGame(depositAmount)
                  const txreceipt = await tx.wait(1)
                  await VRF.fulfillRandomWords(txreceipt.events[2].args.requestId, coinflip.address)
                  const viewGameNumber = (await coinflip.viewGameNumber()) - 1
                  const viewWinner = await coinflip.viewWinner(viewGameNumber)
                  const WinnerBalance = await coinflip.balanceOf(viewWinner)
                  const gameOwnerBalance = await coinflip.balanceOf(deployer)
                  const loser = viewWinner == player.address ? player2.address : player.address
                  const LoserBalance = await coinflip.balanceOf(loser)
                  const getGameFee = await coinflip.getGameFee()

                  // GET THE BALANCE OF WINNER, GAMEOWNER, AND LOSER AFTER THE GAME
                  assert.equal(WinnerBalance.toString(), depositAmount * 2 - getGameFee.toString())
                  assert.equal(gameOwnerBalance.toString(), getGameFee.toString())
                  assert.equal(LoserBalance.toString(), 0)

                  // CHECK LENGHT OF GAMES IN PROGRESS AND FINISHED GAMES
                  const viewAvailableGames = await coinflip.allAvailableGames()
                  const viewGamesInProgress = await coinflip.allGamesInProgress()
                  const viewFinishedGames = await coinflip.allFinishedGames()
                  assert.equal(viewAvailableGames.toString(), 0)
                  assert.equal(viewGamesInProgress.toString(), 0)
                  assert.equal(viewFinishedGames.toString(), 1)
              })
              it("Gets back random Number array", async () => {
                  const Player2Connected = coinflip.connect(player2)
                  await Player2Connected.deposit({ value: depositAmount })
                  const tx = await Player2Connected.joinGame(depositAmount)
                  const txreceipt = await tx.wait(1)
                  await VRF.fulfillRandomWords(txreceipt.events[2].args.requestId, coinflip.address)
              })
          })
      })
