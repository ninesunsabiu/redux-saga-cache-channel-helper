import { createStore, applyMiddleware, AnyAction } from 'redux';
import sagaMiddleware from 'redux-saga';
import { takeCache } from 'index';
import { cancel, take } from 'redux-saga/effects';

const expTime = 1 * 1000;
const delayP = (delay: number) => new Promise((r) => setTimeout(r, delay));
const actionKey = (action: AnyAction) => [JSON.stringify(action), expTime] as [string, number];

test('takeCache: sync actions', () => {
    let called = 0;
    const delayMs = expTime;
    const largeDelayMs = delayMs + 100;
    const actual: [number, unknown][] = [];
    const expected = [[1, 'a']];
    const middleware = sagaMiddleware();
    const store = createStore(() => ({}), {}, applyMiddleware(middleware));
    middleware.run(saga);

    function* fnToCall(action) {
        called++;
        actual.push([called, action.payload]);
    }

    function* saga() {
        const task = yield takeCache('ACTION', fnToCall, actionKey);
        yield take('CANCEL_WATCHER');
        yield cancel(task);
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
            expect(actual).toEqual(expected);
        });
});

test('takeCache: async actions', () => {
    let called = 0;
    const delayMs = 33;
    const smallDelayMs = delayMs - 10;
    const largeDelayMs = expTime + 10;
    const actual: [number, unknown][] = [];
    const expected = [
        [1, 'a'],
        [2, 'b'],
        [3, 'a'],
        [4, 'a']
    ];
    const middleware = sagaMiddleware();
    const store = createStore(() => ({}), {}, applyMiddleware(middleware));
    middleware.run(saga);

    function* fnToCall(action) {
        called++;
        actual.push([called, action.payload]);
    }

    function* saga() {
        const task = yield takeCache('ACTION', fnToCall, actionKey);
        yield take('CANCEL_WATCHER');
        yield cancel(task);
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
            expect(actual).toEqual(expected);
        });
});
