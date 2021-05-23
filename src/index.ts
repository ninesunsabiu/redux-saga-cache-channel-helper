import { call, fork, put, takeEvery } from 'redux-saga/effects';
import type { CacheFn, WorkerSaga } from 'types';
import type { ActionPattern, Channel } from '@redux-saga/types';
import type { AnyAction } from 'redux';
import createCacheChannel from 'channel';

export function takeCache(cache: CacheFn, pattern: ActionPattern, worker: WorkerSaga, ...args: unknown[]) {
    function* main(p: ActionPattern, c: CacheFn, saga: WorkerSaga, ...restArgs: unknown[]) {
        const cacheChannel: Channel<AnyAction> = yield call(createCacheChannel, c);

        function* putCacheChannel(channel: Channel<AnyAction>, message: AnyAction) {
            yield put(channel, message);
        }

        yield takeEvery(cacheChannel, saga, ...restArgs);
        yield takeEvery(p, putCacheChannel, cacheChannel);
    }

    return fork(main, pattern, cache, worker, ...args);
}
