Dual Channel Mode
========================
A Proposed Feature
------------------------

# Overview
The Administrator is secretly trying to recruit the player into helping to fix the abandoned mall.
The new recruit doesn't need to know binary, etc., but they do need to be willing and able to learn it.
Curiosity is the test.

As The Administrator sends banal, corporate-sounding messages, it will lay hints about the side channel.
On the side channel, The Administrator will give clues, hints, and outright instructions on what to do next.

# In-Game Presentation
Within the game, the corporate-approved messages will be plain text that the user reads.
But the side channel, the secrets, will come as binary that the player must decode.

# Design work (game design and visual design)
We need to figure out two things:
  1. How we will show the two channels to the player.
     I envision two screens, one above the other.
     The top one is the text screen and the bottom one is the binary interface.
     This will be a challenge with limited screen space.
  2. What will The Administrator say to alert the player to the secret messages. 
     This is really just a fun writing exercise.
     "Welcome to the mall. There is lots to discover here. Take today's coupon card; its contents will help you learn about the mall..."


# Settled design (v1)

## Tuned channel + bleed strip
The player is *tuned* to exactly one channel, which gets the whole screen.
The other is not gone: it stays as a thin strip at the edge, showing its channel
tag and a clipped preview — the announcement's first line, or a run of raw bits.
Too small to read, big enough to prove something is happening over there.

Both screens at once would kill the feature. If the player can read the plain
text and the binary side by side, there is no act of curiosity to reward; the
binary is just decoration sitting next to its own answer. Making the player
*choose* is what turns tuning into the test the Administrator is running.

## The strip is the button
There is no separate switch. Tapping the strip tunes to it, so the only way to
find the second channel is to fiddle with the one strange thing on screen.
It is a real `<button>`, so keyboard and screen readers get it for free.

Since there is no label to teach the gesture, the strip teaches itself two ways:
it carries an in-fiction tag (`CH 2`) rather than UI chrome, and it **blinks
when that channel has something the player has not seen**. The blink is the
entire discovery mechanism — without it, finding the side channel is luck.
CH 2 therefore starts unread, before the player has done anything at all.

## Each channel keeps its home edge
Text lives at the top, bits at the bottom, whichever one is tuned. Tuning never
moves a channel across the screen, so the gesture is in the same place every
time and the layout reads as two stacked screens with one of them mostly hidden.

## Upper case is the encoding's doing
5bA1 spends its 32 values on A-Z, space and five punctuation marks, so the side
channel physically *cannot* speak in lower case. The Administrator's polite
announcements are sentence case; the secrets shout. That contrast is free, and
it is real rather than styled.

## What v1 is not
No guessing loop. The side channel displays bits and the player decodes them by
eye; wiring in the existing judge/keyboard machinery is the next step, and is
what turns this from a shell into a puzzle area. The `Decoder` toggle on CH 2 is
scaffolding for checking content, not a shipped feature.

Route: `/channels`, ungated like `/chocolate2` while it is a proof of concept.
