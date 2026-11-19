# Dar Carta · دار الكارطة

**[Play the redesigned game](https://dar-carta-friends.proudwand259.chatgpt.site/)**

A Moroccan card club with traditional illustrated Spanish cards, a felt table, fanned hands, portraits, shuffle/deal animations, and point celebrations. Darija, French and English are available.

## Games

- **Ronda**: two players or four in teams, 40 cards, target 41.
- **Moroccan Balote**: four in teams, 32 cards, bidding, trump rules, declarations, Belote/Rebelote, Chute, Litige, Capot, and configurable private-table targets.
- **Brisca**: two players or four in teams, trump tricks and 120 card points.

## Play with friends

Open the live link, choose **Open a table / حل طابلة**, enter a nickname, choose the game and player count, then share the six-character code. Friends open the same link and choose **Join a room / دخل لطابلة**. The host starts when seats are full. Practice bots are also available.

## Current source and local preview

The current hosted application is in [`online/`](online/). Run `node scripts/build.mjs`, then `node scripts/preview.mjs` from that folder; open the printed local URL. No dependency installation is required. Original Node prototype files remain at the root for history; use `online/` for current development.

Tests after building: `node test/engine.test.js`, `node .balote-test.mjs`, `node .sites-test.mjs`. These cover 220 simulated full matches plus rule, privacy and hosted-room checks.

Traditional card art is **CC BY-SA 3.0**, by Basquetteur and Germarquezm, with SVG conversion by gjenkins20. Attribution, pinned sources, modifications and per-card records are in [`online/public/cards/CREDITS.md`](online/public/cards/CREDITS.md) and the manifest. No proprietary artwork or app code was copied from the Balote reference.

This remains a small friend-testing release. It uses guest sessions, server-side room storage and legal-move validation; it is not a ranked, production-scale or Play Store release.
