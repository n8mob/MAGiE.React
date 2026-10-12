MAGiE-Terminal Card Exchange
===============================================================================

The player-character will communicate with The Administrator (and other devices)
by encoding data onto a mag-stripe card and then inserting or swiping it for the
other device to read.

# An example exchange
## Setting
Early in the game, the player discovers that they have been thrown into Mall
Jail. For some reason, their cell contains a card terminal. The player-character
tries out the terminal - hitting the familiar "wake" button. The terminal
displays some text on its display that doesn't seem to match the circumstances
of being in a cell in the Mall Jail. Something like a standard info Kiosk:

> Welcome to Data Place Mall!
> 
> Enter .INFO. for general information
> Enter .DIRECTORY. for store locations

Etc.

There is also a card on the floor. The player-character picks it up and swipes
it through her MAGiE device. Instead of displaying text, bits appear on MAGiE's
screen. If the player is clever, they can decode the bits as a single word:

    HELLO

encoded in our Alpha-Length, A=1 encoding ("AlphaLengthA1", "AlphaLength", or
even just "Alpha").

If the player inserts the card into the terminal, the terminal text will change.
This message is unexpected and not like any that Proti or Hepi have seen before:

> Hello! I am the Mall Administrator.
> How may I help you?

Typing questions in the terminal will not get the player very far. However, some
statements from the Administrator will hint at using the card reader.

If the player encodes a question in AlphaLength encoding, the Administrator will
overwrite the card with a much more candid response.

## Exchange

SCREEN: Welcome to Data Place Mall! [etc.]

Player encodes a card: WHAT IS GOING ON?
They insert it into the terminal.

> Thank you for your suggestion! We will read it soon.

The terminal makes some card-reader noises and returns the same card with the
question replaced by

    I REGRET TO INFORM YOU THAT YOU ARE IN MALL JAIL.

Player encodes

    WHY ARE WE IN MALL JAIL?

and inserts it.

The terminal overwrites the card and returns it.

    SECURITY CAPTURES ANYONE WHO ENTERS THE MALL NOW.

The player is confused and encodes something like

    SINCE WHEN? WE COME TO THE MALL ALL THE TIME!

And insert it, then receive the response

    IT HAS BEEN GOING ON FOR YEARS. THE MALL USED TO BE FULL OF
    SHOPPERS AND MALL EMPLOYEES! THEN THE SHOPPERS ALL WENT AWAY.
    AFTER THE SHOPPERS DISAPPEARED, .SECURITY. WAS INSTALLED. NOW
    ANYBODY COMING IN GETS CAPTURED AND THROWN IN JAIL.

And so on.
