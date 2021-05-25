import type { Action } from 'redux';
import type { Channel } from 'redux-saga';
import { channel } from 'redux-saga';
import type { CacheFn } from './types';

type CacheKey = string;
type ExpirationTime = number;

export default <T>(cacheFn: CacheFn): Channel<Action<T>> => {
    const chan = channel<Action<T>>();
    const cacheMap = new Map<CacheKey, { timestamp: number; expiredTime: ExpirationTime }>();
    return {
        put: (message) => {
            const [key, expTime = 0] = cacheFn(message);
            const cacheInfo = cacheMap.get(key);
            const defaultInfo = { timestamp: Date.now(), expiredTime: expTime };

            const { timestamp, expiredTime } = cacheInfo ?? defaultInfo;
            const isInCacheTime = timestamp + expiredTime;
            if (cacheInfo !== undefined && defaultInfo.timestamp <= isInCacheTime) {
                return;
            }
            cacheMap.set(key, { expiredTime, timestamp: defaultInfo.timestamp });
            chan.put(message);
        },
        take: chan.take.bind(chan),
        close: chan.close.bind(chan),
        flush: chan.flush.bind(chan)
    };
};
