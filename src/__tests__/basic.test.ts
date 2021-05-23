import type { Task } from 'redux-saga';
import type { AnyAction } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import sagaMiddleware from 'redux-saga';
import { takeCache } from 'index';
import { all, cancel, put, take, takeEvery } from 'redux-saga/effects';

const expTime = 1 * 1000;
const delayP = (delay: number) => new Promise((r) => setTimeout(r, delay));
const actionKey = (action: AnyAction) => [JSON.stringify(action), expTime] as [string, number];

test('takeCache: sync actions', () => {
    let called = 0;
    const delayMs = expTime;
    const largeDelayMs = delayMs + 100;
    const actual: [number, string][] = [];
    const expected = [[1, 'a']];
    const middleware = sagaMiddleware();
    const store = createStore(() => ({}), {}, applyMiddleware(middleware));
    middleware.run(saga);

    function fnToCall(action: { type: string; payload: string }) {
        called++;
        actual.push([called, action.payload]);
    }

    function* saga(): Generator<unknown, void, unknown> {
        const task = yield takeCache(actionKey, 'ACTION', fnToCall);
        yield take('CANCEL_WATCHER');
        yield cancel(task as Task);
    }

    return Promise.resolve()
        .then(() => {
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            });
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            });
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            });
        })
        .then(() => delayP(largeDelayMs))
        .then(() =>
            store.dispatch({
                type: 'CANCEL_WATCHER'
            })
        )
        .then(() => {
            expect(actual).toStrictEqual(expected);
        });
});

test('takeCache: async actions', () => {
    let called = 0;
    const delayMs = 33;
    const smallDelayMs = delayMs - 10;
    const largeDelayMs = expTime + 10;
    const actual: [number, string][] = [];
    const expected = [
        [1, 'a'],
        [2, 'b'],
        [3, 'a'],
        [4, 'a']
    ];
    const middleware = sagaMiddleware();
    const store = createStore(() => ({}), {}, applyMiddleware(middleware));
    middleware.run(saga);

    function fnToCall(action: { type: string; payload: string }) {
        called++;
        actual.push([called, action.payload]);
    }

    function* saga(): Generator<unknown, void, unknown> {
        const task = yield takeCache(actionKey, 'ACTION', fnToCall);
        yield take('CANCEL_WATCHER');
        yield cancel(task as Task);
    }

    return Promise.resolve()
        .then(() =>
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            })
        )
        .then(() => delayP(smallDelayMs))
        .then(() =>
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            })
        )
        .then(() => delayP(smallDelayMs))
        .then(() =>
            store.dispatch({
                type: 'ACTION',
                payload: 'b'
            })
        )
        .then(() => delayP(largeDelayMs))
        .then(() =>
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            })
        )
        .then(() => delayP(largeDelayMs))
        .then(() =>
            store.dispatch({
                type: 'ACTION',
                payload: 'a'
            })
        )
        .then(() => delayP(smallDelayMs))
        .then(() =>
            store.dispatch({
                type: 'CANCEL_WATCHER'
            })
        )
        .then(() => {
            expect(actual).toStrictEqual(expected);
        });
});

test('takeCache: in saga', () => {
    let called = 0;
    const actual: [number, unknown][] = [];
    const expected = [
        [1, 0],
        [2, 1],
        [3, 2]
    ];
    const cacheKeyFn = jest.fn(actionKey);

    const middleware = sagaMiddleware();
    const store = createStore(() => ({}), {}, applyMiddleware(middleware));
    const actionCreator = (type: string) => (payload: number) => ({ type, payload });
    const [createAAction, createBAction] = ['ACTION-A', 'ACTION-B'].map(actionCreator) as [
        ReturnType<typeof actionCreator>,
        ReturnType<typeof actionCreator>
    ];
    function* workerA() {
        const tasks = Array.from({ length: 3 }).map((_, index) => put(createBAction(index)));
        yield all(tasks);
    }
    function workerB(action: { type: string; payload: number }) {
        called++;
        actual.push([called, action.payload]);
    }
    function* saga() {
        yield all([takeEvery('ACTION-A', workerA), takeCache(cacheKeyFn, 'ACTION-B', workerB)]);
    }
    middleware.run(saga);

    store.dispatch(createAAction(0));
    expect(cacheKeyFn).toBeCalledTimes(3);
    expect(actual).toStrictEqual(expected);
});
