import { near } from 'near-sdk-js';

import { EventLogData } from './nep/NEP-297';

export function promiseResult(): { result?: string; success: boolean } {
  let result, success;

  try {
    result = near.promiseResult(0);
    success = true;
  } catch (err) {
    result = undefined;
    success = false;
  }

  return { result, success };
}

export function emit<E extends string, D>(
  eventLogData: EventLogData<E, D>,
): void {
  near.log(`EVENT_JSON${JSON.stringify(eventLogData)}`);
}
