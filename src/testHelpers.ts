import { IActor } from './interfaces'

export function makeActor(id: number, isAdmin = false): IActor {
  return { flipperId: `actor:${id}`, isAdmin }
}
