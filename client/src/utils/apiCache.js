// High-performance In-Memory Cache with TTL for fast client dashboard loading

const memoryCache = new Map();

export const cachedFetch = async (authFetch, url, ttlMs = 15000) => {
    const cached = memoryCache.get(url);
    const now = Date.now();

    // If cache is fresh, return cached data immediately
    if (cached && (now - cached.timestamp < ttlMs)) {
        return cached.data;
    }

    try {
        const res = await authFetch(url);
        const data = await res.json();
        
        if (res.ok && !data.error) {
            memoryCache.set(url, { timestamp: now, data });
        }
        return data;
    } catch (err) {
        // Fallback to stale cache if network fails
        if (cached) return cached.data;
        throw err;
    }
};

export const clearApiCache = (urlPrefix) => {
    if (!urlPrefix) {
        memoryCache.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.includes(urlPrefix)) {
            memoryCache.delete(key);
        }
    }
};
