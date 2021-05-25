import type { ForkEffect, HelperWorkerParameters } from 'redux-saga/effects';
import type { ActionPattern, Channel, ActionMatchingPattern } from '@redux-saga/types';
import type { Action, AnyAction } from 'redux';
import { call, fork, put, takeEvery } from 'redux-saga/effects';
import type { CacheFn } from './types';
import createCacheChannel from './channel';

export function takeCache<P extends ActionPattern>(
    cache: CacheFn,
    pattern: P,
    worker: (action: ActionMatchingPattern<P>) => any
): ForkEffect<never>;
export function takeCache<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    cache: CacheFn,
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): ForkEffect<never>;
export function takeCache<A extends Action>(
    cache: CacheFn,
    pattern: ActionPattern<A>,
    worker: (action: A) => any
): ForkEffect<never>;
export function takeCache<A extends Action, Fn extends (...args: any[]) => any>(
    cache: CacheFn,
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
): ForkEffect<never>;

export function takeCache(cache: CacheFn, pattern: ActionPattern, worker: any, ...args: unknown[]) {
    function* main(p: ActionPattern, c: CacheFn, saga: any, ...restArgs: unknown[]) {
        const cacheChannel: unknown = yield call(createCacheChannel, c);

        function* putCacheChannel(channel: Channel<AnyAction>, message: AnyAction) {
            yield put(channel, message);
        }

        yield takeEvery(cacheChannel as Channel<AnyAction>, saga, ...restArgs);
        yield takeEvery(p, putCacheChannel, cacheChannel as Channel<AnyAction>);
    }

    return fork(main, pattern, cache, worker, ...args);
}
