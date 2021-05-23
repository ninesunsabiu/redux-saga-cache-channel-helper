import type { Action } from 'redux';
import type { Channel, Buffer } from 'redux-saga';
import type { CacheFn } from 'types';
import { stdChannel, channel, buffers, END } from 'redux-saga';

type CacheKey = string;
type ExpirationTime = number;

export default function <T>(cacheFn: CacheFn): Channel<Action<T>> {
    const { put, ...others } = channel<Action<T>>();
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
            put(message);
        },
        ...others
    };
}
