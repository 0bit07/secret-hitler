
const store = new Map<string, string>();

export const mockRedisClient = {
    connect: async () => console.log('Mock Redis Connected'),
    quit: async () => console.log('Mock Redis Disconnected'),
    set: async (key: string, value: string) => {
        store.set(key, value);
    },
    get: async (key: string) => {
        return store.get(key) || null;
    },
    exists: async (key: string) => {
        return store.has(key) ? 1 : 0;
    }
};
