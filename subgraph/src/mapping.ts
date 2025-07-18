import { NewWinner } from "../generated/WorldWar/WorldWar"
import { Winner } from "../generated/schema"

export function handleNewWinner(event: NewWinner): void {
  let entity = new Winner(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.newWinner = event.params.newWinner
  entity.newBudget = event.params.newBudget
  entity.blockNumber = event.block.number
  entity.transactionHash = event.transaction.hash
  entity.save()
} 