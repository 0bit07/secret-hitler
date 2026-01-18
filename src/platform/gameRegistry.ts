
export const GameRegistry = {
    'secret-hitler': {
        id: 'secret-hitler',
        name: 'Secret Hitler',
        minPlayers: 5,
        maxPlayers: 10
    }
} as const;

export type GameId = keyof typeof GameRegistry;
