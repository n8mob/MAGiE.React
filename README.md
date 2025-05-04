MAGiE: Your MAGnetic interactive Explorer
=================================================
React Version
-------------------------------------------------

# Long story short

This is a binary-encoding puzzle game implemented as a React single-page application.

It is partly a learning exercise for me, Nate Grigg, to learn React.

But it is also an attempt to turn the MAGiE puzzle mechanic into a daily puzzle, like a Sudoku or a crossword. 

I intend to release this as **free** software, but I haven't figured out the details, like settling on a license.
If all you want to do is play the game and tinker with the code, then please, be my guest.
But for now I, Nate Grigg, retain the copyright: all rights reserved.
Please contact me for any use cases which fall outside of "tinkering with" and "playing" the game.

# To Play
I'm just learning React and Node, so I'm not sure how hard or easy it will be for you to run the game.

I _believe_ that if you already have Node and npm installed,
then all you need to do is clone the repo, navigate to the directory, and run `npm start`.

The one thing that will bite you is that I have a separate project to generate menu files that contain the puzzles.

That project can be found in my [puzzleeditor2020 repository](https://github.com/n8mob/puzzleeditor2020).

But you'll need to run that Django project and then add some puzzles for it to work.

If you'd like to contribute to this project, I think a good first step would be to modify the React app 
to allow a choice between a static JSON file, or an API for the puzzles.

## Narrow output

A lot of the lines of text are constrained to 13 characters.
This reflects the stylistic choices from the Mobile/Unity versions of the game.

It had a very retro aesthetic, with an LCD-screen motif.
My designer buddy had created a nice-looking, chunky pixel font for us.
That, plus the retro-ness of it, kept the text display narrow.

So if you feel cramped, it may help if you imagine yourself as
a 10-year-old whose family apartment and school are both attached to a rad, retro-future, 80's shopping mall.

# Long story long(er)

I originally implemented this game in the Unity 3D game engine
and made it available in the Apple App Store and the Google Play Store.

I stopped paying my Apple Developer Dues, so they de-listed the game.
And I can't seem to find it in the Google Play Store, but I believe it's there.

This React version of the game, as it is today, 30 July, 2024, is a pretty straight port of the Unity game.
There are still gaps in the implementation, like animation and sound effects. But most of the game is playable.

My next steps will be the daily-ization of the thing.
So, if you have any product or marketing advice along those lines, I'd love to hear it.
If you'd like to contribute code to daily-game features, be my guest.

I'm sure I'll still be plugging away at this on my own for a while, but watch for updates. 
If I can get anything close to a daily puzzle feature running, I'll publish it somewhere.
