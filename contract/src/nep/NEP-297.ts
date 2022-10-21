

export type EventLogData<D> = {
    standard: string,
    version: string,
    event: string,
    data?: D,
}