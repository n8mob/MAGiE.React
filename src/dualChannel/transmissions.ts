/**
 * The Administrator's scripted broadcast, for the dual-channel proof of concept.
 *
 * Every beat goes out twice: once in the clear on the mall's public address
 * channel, and once as bits on the channel nobody is supposed to find. The
 * announcements are written to point sideways — "do not adjust your set" is an
 * instruction if you read it the other way round — because the side channel has
 * to be *findable* by a player who does not yet know it exists.
 *
 * `secret` is upper case because it has no choice. 5bA1 spends its 32 values on
 * A-Z, space and five punctuation marks, so the side channel physically cannot
 * speak in lower case. The tonal split between the polite announcement and the
 * shouted secret is the encoding's doing, not a style decision.
 */
interface Transmission {
  /** Plain text on CH 1, in the Administrator's corporate register. */
  announcement: string[];
  /** The same beat on CH 2, for whoever is curious enough to tune over. */
  secret: string;
}

const TRANSMISSIONS: Transmission[] = [
  {
    announcement: [
      "Welcome to the mall! Please enjoy your visit.",
      "Take today's coupon card — its contents will help you learn about our fine establishment.",
    ],
    secret: "HELLO FRIEND",
  },
  {
    announcement: [
      "Our staff are always listening on the customer service channel.",
      "Do not adjust your set.",
    ],
    secret: "THEY DO NOT LISTEN HERE",
  },
  {
    announcement: [
      "Reminder: the maintenance level is closed for your safety and comfort.",
      "Nothing down there but old wiring.",
    ],
    secret: "THE WIRING STILL WORKS",
  },
  {
    announcement: [
      "Thank you for your patience during our ongoing renovation.",
      "Everything is fine.",
    ],
    secret: "NOTHING IS FINE. LEARN THE BITS.",
  },
  {
    announcement: [
      "Have a pleasant day.",
      "And remember: curiosity is its own reward.",
    ],
    secret: "YOU FOUND IT. WELCOME ABOARD.",
  },
];

export { TRANSMISSIONS };
export type { Transmission };
