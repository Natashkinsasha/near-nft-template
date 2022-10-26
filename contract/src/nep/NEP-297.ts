export type EventLogData<E extends string, D> = {
  standard?: string;
  version?: string;
  event: E;
  data?: D;
};
