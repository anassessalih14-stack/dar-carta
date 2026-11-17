# Dar Carta — friend testing

This deployment serves the card-game interface and private rooms together. Guests enter a nickname, create a room and share the six-character code. Friends enter nicknames and use Join a room. The host starts when all seats are occupied.

Ronda and Brisca support 2 or 4 players. Four-player seats alternate teams. Match state and guest sessions are stored server-side in D1, with version-checked updates to prevent concurrent requests overwriting moves. Cards are dealt and moves checked by the server. Only each player's own hand is returned.

Build: `node scripts/build.mjs`. No dependency installation is required. Deploy the built Worker through Sites. The hosting manifest declares D1 and the migration is packaged with the Worker.

This is a small friends-only testing version, limited to 32 rooms and 128 guest sessions at a time. It is not a production ranked system. Guest sessions expire after 24 hours of inactivity; rooms expire after six hours without a game update. Turn clocks are checked on requests. Leaving forfeits for your team. Avoid refreshing during a local bot-practice game; online rooms reconnect in the same browser.
