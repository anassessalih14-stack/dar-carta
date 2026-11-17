# Dar Carta · دار الكارطة

**[Open the live friend-testing game](https://dar-carta-friends.proudwand259.chatgpt.site/)**

Choose **Create a room / حل طابلة**, enter a nickname, select Ronda or Brisca and 2 or 4 players, then share the six-character room code. Friends open the same link and choose **Join a room / دخل لطابلة**. The host starts once every seat is filled.

The hosted source is in [`online/`](online/). This is the initial multiplayer test; traditional card artwork, shuffle/deal animations, and animated point celebrations are still planned for the next iteration.


A first playable Moroccan card club, built for iterative development before an Android release.

## What is working

- **Ronda**: 1 vs 1 and four-player partnerships, match scoring to 41, sequence captures, Missa, automatic Ronda/Tringa announcements, and four-player hit chains.
- **Brisca**: 1 vs 1 and partnerships, trumps, trick resolution, stock draws, and 120-point scoring.
- Practice against clearly labelled bots. Bots use their own hands and public information.
- Private multiplayer rooms with invite links/codes, and separate public matchmaking queues by game and player count.
- Server-controlled shuffling, card ownership, moves, scoring, and private player views.
- Anonymous nickname sessions, reconnect by reopening the same server in the same browser, 45-second turns, automatic timeout moves, and disconnected-player forfeits.
- Darija (Arabic script, right-to-left), French, and English; three table themes and responsive phone layouts.
- Original code-drawn Spanish-suit card illustrations. No copied commercial card-face artwork.

**Online play requires a running Node server. GitHub Pages supports the practice client only unless configured to use a separately hosted server. There are no simulated human opponents or invented online-player counts.**

## Start on your computer

Install Node.js 22 or later from its official website, then open this folder in a terminal:

```sh
node server.js
```

Open `http://localhost:3000`. No package installation or build step is needed.

1. Pick a language and 2 or 4 players.
2. Choose **Practise with bots** on Ronda or Brisca to play immediately.
3. For multiplayer, choose **Connect to server**, enter a nickname and `http://localhost:3000`.
4. **Create a room**, choose the game/player count, and invite players. The host starts when all seats fill.
5. Or select **Find a match**. Public tables start automatically when full. Queues never mix game types or player counts.

For multiple test players on one computer, use separate browser profiles or a normal and private browser window so each gets an independent session. A localhost invite works only on that computer. Friends elsewhere need an internet-hosted HTTPS server.

## Browser-only GitHub preview

In GitHub **Settings → Pages**, publish **main / (root)**. The root entry redirects to `public/`. Practice works there. Server features require the hosted backend described below. Opening `index.html` directly as a `file://` URL is not supported because the client uses ES modules.

## Host multiplayer (next setup step)

Use a Node/Docker host that keeps a process running. The included Dockerfile serves both the interface and API from the same domain. Start command: `node server.js`; the server reads the host's `PORT` environment variable (default 3000). Health endpoint: `/api/health`. Configure HTTPS through the hosting provider.

When the server serves the interface, leave `public/config.js` empty as supplied; the connection dialog can use the server's own URL. For a separate GitHub Pages client, set:

```js
window.DAR_CARTA_API = 'https://YOUR-HOSTED-SERVER';
```

On the backend, allow that client origin:

```text
ALLOWED_ORIGINS=https://anassessalih14-stack.github.io
```

Allow only the intended origins. The connection dialog stores the guest token and chosen server in that browser. Use HTTPS for every non-local server. Do not place any hosting credentials in this repository.

## Rules profile

See [RULES.md](RULES.md) and the translated in-app rules. These are explicit starter variants, not a claim to implement every regional rule. Two seats form opposing sides; four seats alternate sides, with partners opposite. Seat numbers specify anticlockwise play order.

Research sources:

- [Ronda — Pagat](https://www.pagat.com/fishing/ronda.html)
- [Brisca — Fournier](https://www.nhfournier.es/en/como-jugar/brisca/)
- [Tute — Fournier](https://www.nhfournier.es/en/como-jugar/tute/), researched for a future mode, not implemented.

## Tests

```sh
node --test test/engine.test.js test/server.test.js
```

For restricted environments that cannot spawn test workers:

```sh
node --test --test-isolation=none test/engine.test.js test/server.test.js
```

Coverage includes 160 seeded complete games, card conservation, opening rules, capture chains, final-card Missa, trump resolution, ownership and turn checks, private views, and real HTTP room/matchmaking tests.

## Limits before a commercial launch

This is a **development prototype**, not the final Play Store release. Rooms and sessions are kept in one process's memory and reset on restart. Run only one server instance for now. Guest identities are not verified accounts, and public rooms cannot prevent coordinated play. Inactive rooms expire after six hours without an update; guest sessions expire after a day without a request. Leaving an active match forfeits for your side. A turn without a request for over two minutes triggers a forfeit when that player's deadline is checked; otherwise timeout moves are automatic. Waiting rooms have no bots.

Not yet implemented: persistent accounts/statistics, friends lists (invitation links work), chat/reporting/moderation, multi-server storage, production abuse controls, ranked play, payment/ads, Android packaging, or Play Store publication. The basic per-IP rate limit is a starter safeguard and must be redesigned for the chosen production proxy. Font downloads are optional; system fonts are used when unavailable. Language preferences and theme are stored locally; practice games are not persisted on reload.

## Development order

1. Playtest Ronda and Brisca with the owner and agree on local rule adjustments.
2. Host the backend and test invitations, full matches, and reconnections with real friends on separate devices.
3. Add persistent accounts, database-backed matches, monitoring, and moderation.
4. Implement Touti/Tute after choosing its rules. Confirm the exact local meanings of “cant coupé” and Balot before implementing them.
5. Prepare the Android app, store assets, policies, and closed testing.
