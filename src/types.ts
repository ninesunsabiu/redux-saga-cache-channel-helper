import type { AnyAction } from 'redux';

export interface CacheFn {
    (action: AnyAction): [key: string, expTime?: number];
}

export interface WorkerSaga {
    (...args: unknown[]): any;
}
