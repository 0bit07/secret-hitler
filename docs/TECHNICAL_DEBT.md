# Technical Debt & Future Improvements

This document tracks known issues, optimizations, and features that have been deferred to prioritize the core game loop.

## High Priority

### 1. Reconnection Handling
-   **Description:** Currently, if a client disconnects, they cannot rejoin the same session with the same player identity easily (requires manual socket/session mapping).
-   **Impact:** Poor user experience if internet connection drops.
-   **Plan:** Implement session tokens (JWT or UUID) stored in LocalStorage to reclaim the player slot upon reconnection.

### 2. Comprehensive Engine Testing
-   **Description:** While verified with scripts, the engine lacks a comprehensive suite of unit tests for edge cases.
-   **Impact:** Risk of regression when adding new features (e.g., Veto power).
-   **Plan:** Add Jest tests covering all FSM transitions and invalid actions.

## Medium Priority

### 3. Client UI Polish
-   **Description:** The current client (`client/src/main.ts`) is a developer tool for verification.
-   **Impact:** Unusable for actual end-users.
-   **Plan:** Build a proper React/Vue/Svelte frontend with nice animations (using the new `client` folder structure).

### 4. Structured Logging
-   **Description:** Server uses `console.log` and `console.error`.
-   **Impact:** Hard to debug in production or parse logs.
-   **Plan:** Integrate a logger like `winston` or `pino`.

## Low Priority / Optimization

### 5. Redis Production Setup
-   **Description:** Currently using `MockRedisStore` or basic `RedisStore`.
-   **Impact:** Need proper configuration for connection pooling, timeouts, and error handling for a real Redis instance.
-   **Plan:** Enhance `redisStore.ts` with production-grade configuration.

### 6. Code Duplication in Logic
-   **Description:** Some validation logic might be repeated between `validator.ts` and individual logic files.
-   **Plan:** Refactor to centralize common validation rules.
