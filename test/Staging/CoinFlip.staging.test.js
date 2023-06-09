const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip 
    : describe("CoinFlip Staging Tests", function () {
          let coinflip, gameFee, deployer, player, player2
          const depositAmount = ethers.utils.parseEther("0.1")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              coinflip = await ethers.getContract("Gameplay", deployer)
              await deployments.fixture(["all"])
              gameFee = await coinflip.getGameFee()
          })

          describe("fulfillRandomWords", function () {
              it("finishes a game of coinflip", async () => {
                  console.log("Setting up a test...")
                  console.log("Setting up listeners...")
                  const accounts = await ethers.getSigners()
                  player = accounts[1]
                  player2 = accounts[2]

                  await new Promise(async (resolve, reject) => {
                      coinflip.once("gameFinished", async () => {
                          try {
                              // THE WINNER AND TRANSFER LOGIC
                              const viewWinner = await coinflip.viewWinner()
                              const WinnerBalance = await coinflip.balanceOf(viewWinner)
                              const GameOwnerBalance = await coinflip.balanceOf(deployer)
                              assert.equal(
                                  WinnerBalance.toString(),
                                  depositAmount * 2 - gameFee.toString()
                              )
                              assert.equal(GameOwnerBalance.toString(), gameFee.toString())

                              // THE ARRAY LOGIC AND STORAGE
                              const viewAvailableGames = await coinflip.allAvailableGames()
                              const viewGamesInProgress = await coinflip.allGamesInProgress()
                              const viewFinishedGames = await coinflip.allFinishedGames()
                              assert.equal(viewAvailableGames.toString(), 0)
                              assert.equal(viewGamesInProgress.toString(), 0)
                              assert.equal(viewFinishedGames.toString(), 1)

                              // To WTIHDRAW FUNDS AT THE END
                              const PlayerConnected = coinflip.connect(player)
                              const Player2Connected = coinflip.connect(player2)
                              await coinflip.withdraw(gameFee)
                              if (viewWinner == player.address) {
                                  await PlayerConnected.withdraw(WinnerBalance)
                              } else {
                                  await Player2Connected.withdraw(WinnerBalance)
                              }
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      console.log("Players connecting...")
                      const PlayerConnected = await coinflip.connect(player)
                      console.log("Player 1 is connected...")
                      const Player2Connected = await coinflip.connect(player2)
                      console.log("Player 2 is connected...")
                      const deposit2 = await PlayerConnected.deposit({ value: depositAmount })
                      await deposit2.wait(1)
                      console.log("Player 1 deposited money...", depositAmount.toString())
                      const deposit3 = await Player2Connected.deposit({ value: depositAmount })
                      await deposit3.wait(1)
                      console.log("Player 2 deposited money...", depositAmount.toString())
                      console.log("Player 1 starting the game...")
                      const startgame = await PlayerConnected.startGame(depositAmount, 0)
                      await startgame.wait(1)
                      console.log("Player 2 joining the game...")
                      const joingame = await Player2Connected.joinGame(depositAmount)
                      await joingame.wait(1)
                  })
              })
          })
      })
