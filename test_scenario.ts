/**
 * Verification Scenario
 * 
 * Simulates a partial game flow to verify:
 * 1. Initialization
 * 2. Role assignment
 * 3. Nomination
 * 4. Voting
 * 5. Legislation
 * 6. State sanitization
 */

import { gameReducer, createLobbyState, sanitizeStateForPlayer, Role, Phase } from './src/engine';
import { Player } from './src/engine/types';

// Helper to log steps
function log(step: string, details?: any) {
    console.log(`\n=== ${step} ===`);
    if (details) console.log(JSON.stringify(details, null, 2));
}

// Helper to assert
function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ ${message}`);
    }
}

async function runScenario() {
    console.log('Starting verification scenario...');

    // 1. Initialize Lobby
    let state = createLobbyState();
    assert(state.phase === Phase.LOBBY, 'Phase should be LOBBY');

    // 2. Start Game with 5 players
    const players = [
        { id: 'p1', name: 'Alice', avatarId: 'avatar-01' },
        { id: 'p2', name: 'Bob', avatarId: 'avatar-02' },
        { id: 'p3', name: 'Charlie', avatarId: 'avatar-03' },
        { id: 'p4', name: 'Dave', avatarId: 'avatar-04' },
        { id: 'p5', name: 'Eve', avatarId: 'avatar-05' }
    ];

    log('Starting Game');
    const startResult = gameReducer(state, {
        type: 'START_GAME',
        playerId: 'p1',
        playerIds: players
    });

    state = startResult.state;
    assert(state.phase === Phase.ROLE_REVEAL, 'Phase should be ROLE_REVEAL');
    assert(state.players.length === 5, 'Should have 5 players');
    assert(state.policyDeck.length === 17, 'Deck should have 17 policies');

    // Verify roles (3 Lib, 1 Fas, 1 Hitler)
    const roles = state.players.map((p: Player) => p.role);
    const libCount = roles.filter((r: Role) => r === Role.LIBERAL).length;
    const fasCount = roles.filter((r: Role) => r === Role.FASCIST).length;
    const hitlerCount = roles.filter((r: Role) => r === Role.HITLER).length;

    assert(libCount === 3, 'Should have 3 Liberals');
    assert(fasCount === 1, 'Should have 1 Fascist');
    assert(hitlerCount === 1, 'Should have 1 Hitler');

    log('Roles assigned correctly', { roles });

    // 3. Advance to Nomination
    log('Advancing Phase');
    const advanceResult = gameReducer(state, { type: 'ADVANCE_PHASE' });
    state = advanceResult.state;
    assert(state.phase === Phase.NOMINATION, 'Phase should be NOMINATION');

    const president = state.players[state.presidentIndex];
    log(`Current President: ${president.name} (${president.id})`);

    // 4. Nominate Chancellor
    // Find a valid chancellor (not president)
    const chancellorCandidate = state.players.find((p: Player) => p.id !== president.id)!;
    log(`Nominating ${chancellorCandidate.name} (${chancellorCandidate.id})`);

    const nomResult = gameReducer(state, {
        type: 'NOMINATE_CHANCELLOR',
        playerId: president.id,
        chancellorId: chancellorCandidate.id
    });

    state = nomResult.state;
    assert(state.phase === Phase.VOTING, 'Phase should be VOTING');
    assert(state.nominatedChancellor === chancellorCandidate.id, 'Chancellor nominated');

    // 5. Vote (All Yes)
    log('Casting Votes');
    for (const p of state.players) {
        const voteResult = gameReducer(state, {
            type: 'CAST_VOTE',
            playerId: p.id,
            vote: 'ja'
        });
        state = voteResult.state;
    }

    assert(state.phase === Phase.LEGISLATIVE_PRESIDENT, 'Phase should be LEGISLATIVE_PRESIDENT');
    assert(state.presidentHand.length === 3, 'President should have 3 policies');
    log('Election Passed');

    // 6. President Discards
    log('President Discards');
    const discardResult = gameReducer(state, {
        type: 'DISCARD_POLICY',
        playerId: president.id,
        policyIndex: 0
    });
    state = discardResult.state;

    assert(state.phase === Phase.LEGISLATIVE_CHANCELLOR, 'Phase should be LEGISLATIVE_CHANCELLOR');
    assert(state.chancellorHand.length === 2, 'Chancellor should have 2 policies');

    // 7. Chancellor Enacts
    log('Chancellor Enacts');
    const enactResult = gameReducer(state, {
        type: 'ENACT_POLICY',
        playerId: chancellorCandidate.id,
        policyIndex: 0
    });
    state = enactResult.state;

    // Check results
    const enactedLib = state.liberalPoliciesEnacted;
    const enactedFas = state.fascistPoliciesEnacted;
    assert(enactedLib + enactedFas === 1, 'one policy should be enacted');
    assert(state.phase === Phase.NOMINATION, 'Should rotate back to NOMINATION');

    // 8. Verify Privacy
    log('Verifying Sanitize');
    const aliceView = sanitizeStateForPlayer(state, 'p1');
    assert(aliceView.policyDeck!.length === 0, 'Alice should not see deck');

    if (state.players[0].role === Role.LIBERAL) {
        // Check that Alice (Liberal) can't see roles
        const otherRoles = aliceView.players!.filter((p: Player) => p.id !== 'p1').map((p: Player) => p.role);
        assert(otherRoles.every((r: Role) => r === Role.LIBERAL), 'Liberal should see everyone as Liberal');
    }

    log('Scenario Complete - SUCCESS');
}

runScenario().catch(console.error);
