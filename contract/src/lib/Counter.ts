export interface Counter {
  counter: number;
}

export function current(contract: Counter): number {
  return contract.counter;
}

export function increment(contract: Counter): void {
  contract.counter += 1;
}

export function decrement(contract: Counter): void {
  if (contract.counter > 0) {
    contract.counter -= 1;
  }
  throw new Error('Counter: decrement overflow');
}

export function reset(contract: Counter): void {
  contract.counter = 0;
}
