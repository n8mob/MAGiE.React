BLINKING DOOR LOCK
==================

This is a new puzzle type. In the story, Proti and Hepi use a flashlight to blink patterns at a door to unlock it.
The new page will be layed out very similarly to the existing doorLock puzzle. With prompt and feedback at the top and input at the bottom.
The input for this will just be a single button. We should make it look just like the "on-bit" button from DoorLock.tsx (using `keyboard_Bit_on_32x32.png`).

The output will also be similar: one large bit.
We have on- and off-bit PNGs under `src/assets`, I think we'll want to use the "red" variant, to represent a red LED. Scaled up to match the `keyboard_Bit_on` button's size of at least 32x32 pixels.

# Interaction Model
This puzzle is based on the timing of blinks. Our initial implementation will be very simple, but in the future we might add more complications like pauses between numbers of blinks.

So the door will run a timer after it blinks something to the player. If the player doesn't respond within, say, 3 seconds, the door will reset to its passive locked state.

When the player blinks (by tapping the "on-bit" button or '1' or 'space' on the keyboard) within the initial 3-second window, the door will start a different timer of, say, 1 second to allow the player to continue a blink sequence. After each blink that timer will reset. After the 1-second timer expires, the door will evaluate the sequence of blinks that the player gave by tapping the button or keyboard.

# The initial handshake
   1. They player will tap the button.
   2. The door will blink once.
   3. The player will repeat the single blink back by tapping the button again.
      This will conclude the initial handshake.

# Code input phase (initial code implementation)
   1. Then the door will blink a random number of blinks, between 3 and 7 inclusive.
   2. The player is expected to blink the same number of times as the door blinked.
      Using the timout functions described in the Interaction Model secton.

# Implementation plan
1. Add the blinkingDoor route
2. Add a BlinkingDoor.tsx react component
3. Implement it.
