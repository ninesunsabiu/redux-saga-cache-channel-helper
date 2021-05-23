# Redux-Saga Effect Helper: `takeCache`

## 问题

在使用 saga 的开发过程中，会有将某个 API 请求「缓存」下来的需要  
而不管是使用 `takeLatest` 或是 `debounce` 等 helper 都只能针对单个 `action`  
例如下面一个场景：  
```ts
interface FetchOptionsAction {
    type: 'fetch-options';
    payload: {
        /** from anther API */
        id: string;
        flag: 'Src' | 'Dest';
    }
}

// in root saga
import { takeLatest, debounce } from `redux-saga/effects`;

function* workerSaga() {
    // ... do your work
}

function* rootSaga() {
    yield takeLatest('fetch-options', workerSaga);
    // or
    yield debounce('fetch-options', workerSaga);
}
```
在上述场景中，如果我们短时间内多次的触发 `FetchOptionsAction`   
是可以达到限制请求数的效果，但是这些 API 控制的粒度都在 `action` 
如果在短时间内连续获取 id1 id2 ... 的选项，将有部分被过滤掉
这不是我们想要的结果

## 解法

我们想要针对 `action` 进行判断这个请求是否可以被发出  
因此需要有个状态量来保存对应的失效时间  
```ts
declare function takeCache(
    /**
     * 缓存决策函数
     */
    cache: (action: AnyAction) => [
        /** 凭据 */
        cacheKey: string,
        /** 失效时间，单位为毫秒 */
        expirationTime?: number
    ],
    p: ActionPattern,
    /**
     * a Generator function
     */
    worker: (...args: any[]) => any,
    ...workerArgs: unknown[]
): ForkEffect;
```

## 用法

```ts
import { takeCache } from './sagaHelpers/takeCache';

function workerSaga() {
    // ... do your work
}

function* rootSaga() {
    yield takeCache(
        (action: FetchOptionsAction) => {
            const { type, payload: { id, flag } } = action;
            return [[type, id, flag].join(','), 0.5 * 1000];
        },
        'fetch-options',
        workerSaga
    );
}
```
