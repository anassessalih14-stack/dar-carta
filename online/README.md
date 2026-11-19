# Dar Carta — traditional card club

The refreshed interface uses a felt table, illustrated Spanish cards, fanned hands, player portraits, active-turn rings, a previous-trick panel, visible scores, sequential shuffle/deal animations, card flips, sliding plays, winner-directed trick collection, and animated point gains. Darija, French and English are supported, with reduced-motion controls and responsive portrait/landscape layouts.

## Playable games

- **Ronda**: 40 cards, two players or four-player partnerships, first to 41. The original rules profile remains available in the game.
- **Moroccan Balote**: choose three players with 24 cards and individual scores, or four-player partnerships with 32 cards. Both formats have two bidding rounds, optional forced take on a face-up 10, legal-card enforcement, declarations, automatic Belote/Rebelote, Chute, Litige, Capot and final-score deciders. Practice and online setup offer first to 500 or 1000 points before the deal. Buying rotates through all seats, with passed seats marked and a persistent bought-suit / buyer-team label. The forced face-up 10 option is off by default for new matches. This version defaults to 500 and uses an explicit rule that four-of-a-kind announcements outrank runs; house rules are documented in the game.
- **Brisca**: 40 cards, two players or four-player partnerships, trump tricks and 120-point scoring.

The Balote reference informed the traditional table style and documented Moroccan rules; its proprietary artwork and application code were not copied. The corrected Moroccan card faces use the Alb1bls CC0 scan; the retained card back is CC BY-SA 3.0: see `public/cards/CREDITS.md` and its per-file manifest.

This deployment serves the card-game interface and private rooms together. Guests enter a nickname, create a room and share the six-character code. Friends enter nicknames and use Join a room. The host starts when all seats are occupied.

Ronda and Brisca support 2 or 4 players. Four-player seats alternate teams. Match state and guest sessions are stored server-side in D1, with version-checked updates to prevent concurrent requests overwriting moves. Cards are dealt and moves checked by the server. Only each player's own hand is returned.

Build: `node scripts/build.mjs`. No dependency installation is required. Local preview: `node scripts/preview.mjs`. Deploy the built Worker through Sites. The hosting manifest declares D1 and the migration is packaged with the Worker.

Tests: `node test/engine.test.js`, `node .balote-test.mjs`, and `node .sites-test.mjs` after building. These cover 280 complete simulated matches across all games, card conservation and hidden hands, Balote rules/scoring, and hosted private-room actions.

This is a small friends-only testing version, limited to 32 rooms and 128 guest sessions at a time. It is not a production ranked system. Guest sessions expire after 24 hours of inactivity; rooms expire after six hours without a game update. Turn clocks are checked on requests. Leaving forfeits for your team in four-player games; a three-player match is ended without inventing a winner. Avoid refreshing during a local bot-practice game; online rooms reconnect in the same browser.

Three-player Balote uses ranks 1, 6, 7, 10, 11 and 12 in all four suits. Deal five per seat and one face-up card; the buyer receives two more and the others three, for eight each. Each player keeps their own trick points and earned bonuses. There are no partners or team Chute/Litige transfers. Three cards complete a trick; the dealer rotates across three seats. Online private rooms and random queues support this format separately from four-player games.
