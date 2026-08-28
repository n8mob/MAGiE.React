STICKY-NOTE REFERENCE CARD
================================================

Design a reference card for MAGiE, a binary-encoding puzzle game. Diegetically it's a handwritten sticky note taped to the back of the player's handheld device — the world is cassette-future: analog, worn, slightly grubby. The game is rendered so the LCD of the handheld device fills the screen with a dark "bezel" of just a few pixels hinting at the handheld's housing. The top title/banner is on the same dark background to indicate the out-of-the-LCD part of the device. The word "MAGiE" is rendered in 'silver' in the same pixelated font that the simulated LCD uses, but much larger. On the left of the MAGiE title is a button labeled "Aa" for the minimal text settings available today. On the right is a button labeled "?" that brings up the content in the attached screenshot with the filename "old-how-to-card.PNG".

Today we're designing a new "help" screen in the form of this simulated sticky note. So, there in the top-right corner of the "device", we can replace the "?" button with the edge or corner of the sticky note. We can keep the "?" indicator, but we'll render it in a handwritten font instead of the pixelated one from the game screen. Whatever hand-drawn font we go with should match between the help card and the new question mark indicator. We will also implement the help screen to pause the main game, so we can use the as much of the player's screen as we need.

Function first. This is a reference card players consult mid-puzzle under time pressure. It must be scannable at a glance. Content is the 5bA1 map: A=00001 through Z=11010, plus apostrophe, plus space=00000. Let's put a few of the most commonly used letters first, rather than sticking to alphabetical order. I don't want to use actual '1's and '0's. The game uses custom sprites to show the on and off bits.

Most-common letters

E = 00101 T = 10100
A = 00001 O = 01111
N = 01110

And Claude.ai recommends that we use "Landmark letters", so we'll list those next. A is one of the landmark letters, but we included it with ETAOIN up above, so I'll start with B here:

Landmark Letters

B = 00010 D = 00100
H = 01000 P = 10000

And then, we can list the rest of the letters, ordered approximately by frequency to continue the first group listed above.

The rest of the letters

S = 10011 R = 10010
L = 01100 U = 10101
C = 00011 M = 01101
F = 00110 G = 00111
Y = 11001 W = 10111
V = 10110 K = 01011
X = 11000 J = 01010
Q = 10001 Z = 11010

Oh, and the few punctuation marks we have too.

Punctuation ('_' indicates a "space")

_ = 00000 . = 11011
, = 11100 ! = 11101
? = 11110 ' = 11111

Three states:

Tucked — a visible edge/corner peeking at the screen edge, inviting a tap
Fluttering — subtle idle animation when a player stalls, drawing the eye without nagging
Open — the full chart, overlaying the game. Opening it implicitly pauses.

Constraints: Fits a 393×852 CSS viewport (iPhone 16) and up. The game simulates a handheld device: dark bezel framing a lighter LCD screen, with reflective-screen drop shadows doing the LCD work. That look is settled — don't redesign it. The note is paper: warm, matte, physical, contrasting against the screen's flat glassy surface. Don't let the skeuomorphism cost legibility.
