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
- Saudi Baloot remains a different game and is not included. The Moroccan Balote profile below is implemented.

These queued modes are clearly labelled as future work in the app and cannot be selected as playable games.

## Moroccan Balote — `balote-v0.2`

Reference: https://balote.pocketoak.com/en/rules — a publisher-defined Moroccan profile, not a universal claim about every family’s house rules.

Four opposite partners, 32 Spanish cards (remove 2s and 3s), five-card first deal and an offer, two bidding rounds, eight cards after a successful bid. A face-up 10 forces the first bidder when enabled. First lead is the player after the buyer. Trump order: 10, 6, 1, 7, 12, 11, 5, 4; plain order: 1, 7, 12, 11, 10, 6, 5, 4. Follow suit, beat a trump lead when possible, and cut/overcut when void and an opponent is winning.

Declarations are optional and must be made before playing the second card. The server computes disjoint declarations from the original hand. Runs score 20/50/100; fours score 200 for 10, 150 for 6, 100 for 1/7/11/12. In this explicit implementation, fours outrank runs, then the strongest set/run determines the only team whose declarations count. Trump wins an otherwise equal run. Fully tied declarations do not score. A trump 11+12 is counted automatically as 20 Belote points which survive a failed contract.

A hand contains 152 card points and ten for the last trick. The buyer’s team must beat the defence after counted bonuses. In Chute, the defence takes 162 and the declared announcements; buyers keep only their Belote. Exact equal totals are handled as Litige before the Chute check: the defence scores its total and the buyers’ total goes into the pot. The next decisive winner claims the pot. A side with no raw card points concedes 100 Capot. The default target is 500, with 250/1000 available for private tables. Equal final totals at the target require a further hand. The reference itself mentions different default targets in different sections; this app makes its choice explicit.

This is the first playable implementation for friend testing. Regional rule adjustments should be agreed before ranked competition.
