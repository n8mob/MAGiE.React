BLINKING DOOR LOCK
==================

Okay - this is a new puzzle type. the new page will be layed out very similarly to the existing doorLock puzzle. With prompt and feedback at the top and input at the bottom.

# Here is the basic gameplay

1. They player will tap the button.
2. The door will blink once.
3. The player will repeat the single blink back.
4. Then the door will blink a random number of times (between 3 and 7 inclusive (3, 8)).
5. When the player blinks back the same number of times, the door will unlock.

# Implementation ideas
We will use an inactive BitButton for the door's blinking animation. 
The BitButton will be set to null interaction and will use the `Bit_off_Red.png` and `Bit_on_Red.png` images for its visual representation. We may need to adjust the BitButton code to accept custom images... oh, it looks like we might just be setting that up in CSS. We'll figure it out.

# Implementation plan
1. Add the blinkingDoor route
2. Add a BlinkingDoor.tsx react component
3. Implement it.
