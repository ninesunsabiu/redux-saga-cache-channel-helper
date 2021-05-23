import { call, fork, put, takeEvery } from 'redux-saga/effects';
import type { CacheFn, WorkerSaga } from 'types';
import type { ActionPattern, Channel } from '@redux-saga/types';
import type { AnyAction } from 'redux';
import createCacheChannel from 'channel';

export function takeCache(cache: CacheFn, p: ActionPattern, worker: WorkerSaga, ...args: unknown[]) {
    function* main(p: ActionPattern, cache: CacheFn, worker: WorkerSaga, ...args: unknown[]) {
        const cacheChannel: Channel<AnyAction> = yield call(createCacheChannel, cache);

        function* putCacheChannel(channel: Channel<AnyAction>, message: AnyAction) {
            yield put(channel, message);
        }

        yield takeEvery(cacheChannel, worker, ...args);
        yield takeEvery(p, putCacheChannel, cacheChannel);
    }

    return fork(main, p, cache, worker, ...args);
}
