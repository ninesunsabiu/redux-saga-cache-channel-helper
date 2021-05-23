import type { AnyAction } from 'redux';
export interface CacheFn {
    (action: AnyAction): [key: string, expTime?: number];
}
