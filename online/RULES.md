# Starter rule decisions

The UI exposes these decisions in Darija, French, and English. They are versioned so later house-rule changes can be implemented deliberately.

## Ronda — `ronda-v0.1`

Spanish deck of 40 cards, ranks 1–7, 10–12. Partners alternate seats in four-player games. Three cards per player per packet, four face-up opening cards; the opening ranks must be distinct and not one complete four-rank sequence. Dealer rotates between rounds. Equal-rank captures extend upward through contiguous ranks, including 7 → 10. All ranks and suits are conserved.

Automatic declarations remove missed-call penalties and bluffing. A lone Ronda/Tringa scores immediately. Competing declarations resolve once all their relevant cards have been exposed, or at the packet boundary. Tringa outranks Ronda; high rank wins within type. A pot is divided equally for a tied best set, rounded down per winning declaration. Public views never reveal the unplayed ranks of those sets.

Missa is +1 except on the last play of the round. A direct capture of the preceding play earns a hit; a four-player counter-hit can take the pending captured stack with increasing value 1, 5, 10. Its points and original Missa are awarded only to the final holder when the chain closes. This deliberate starter rule delays chain points until they are settled; it is not the immediate-scoring/bluff variant. Chains close at packet boundaries and matching cannot score across a new packet. Two-player hits settle immediately.

The final capturer receives the remaining table cards. A side earns one point for each captured card over 20. First to 41 wins. No special last-card dealer bonus, endgame declaration restrictions, or scoring by transferring captured cards.

Reference: https://www.pagat.com/fishing/ronda.html

## Brisca — `brisca-v0.1`

Three-card hands. The bottom stock card is public trump and drawn last. Players may play any card. Tricks are won by highest trump, or highest lead-suit card if there is no trump. Aces outrank threes, then 12, 11, 10, 7, 6, 5, 4, 2. Point values total 120: 1=11, 3=10, 12=4, 11=3, 10=2, others=0. Trick winner draws first; drawing follows seat order. Winner leads next. Four players share points as opposite partners.

This first version is one complete deal per match. Highest points win; 60–60 is a draw. No trump exchange, signals, or series of deals.

Reference: https://www.nhfournier.es/en/como-jugar/brisca/

## Research queue

- Touti/Tute: confirmed Spanish-deck family; multiple rule variants. Start from Fournier's documented versions, then confirm the intended Moroccan variant.
- “Cant coupé”: the owner's spelling has not yet identified a reliable rules source. Do not silently map it to a different game.
- Balot: confirm the intended deck, bidding, and scoring before choosing between regional games with similar names.

These queued modes are clearly labelled as future work in the app and cannot be selected as playable games.
