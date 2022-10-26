import { assert, LookupSet, near } from 'near-sdk-js';

import { EventLogData } from '../nep/NEP-297';
import { emit } from '../util';

export type PauseEventLogData = EventLogData<
  'pause',
  { pauseId: string; pauser: string }[]
>;
export type UnpauseEventLogData = EventLogData<
  'unpause',
  { pauseId: string; unpauser: string }[]
>;

export interface Pausable {
  pauses: LookupSet;
}

export function assertIsNotPaused(contract: Pausable, pauseId: string): void {
  assert(!contract.pauses.contains(pauseId), 'Function on pause');
}

export function assertIsPaused(contract: Pausable, pauseId: string): void {
  assert(contract.pauses.contains(pauseId), 'Function not on pause');
}

export function _pause(contract: Pausable, pauseId: string): void {
  assertIsNotPaused(contract, pauseId);
  contract.pauses.set(pauseId);
  const pauseEventLogData: PauseEventLogData = {
    event: 'pause',
    data: [
      {
        pauseId,
        pauser: near.predecessorAccountId(),
      },
    ],
  };
  emit(pauseEventLogData);
}

export function _unpause(contract: Pausable, pauseId: string): void {
  assertIsPaused(contract, pauseId);
  contract.pauses.remove(pauseId);
  const unpauseEventLogData: UnpauseEventLogData = {
    event: 'unpause',
    data: [
      {
        pauseId,
        unpauser: near.predecessorAccountId(),
      },
    ],
  };
  emit(unpauseEventLogData);
}
