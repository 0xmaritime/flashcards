# QA Interview Flashcards

A small mobile-first website for learning QA interview questions. Each card has a question, a short answer to say aloud, and more detail if you want it.

## Using it

- **In order / Random.** The switch at the top chooses between the study order and a shuffled deck. "Shuffle again" draws a new random order.
- **Tap the card** (or press Space) to see the answer. Then mark it **Again** or **Got it**.
- **Swipe** left for the next card and right for the previous one. On a keyboard: `←` `→` move, `1` again, `2` got it.
- **Topic menu.** Study everything, one section, or one topic.
- **Which cards.** All cards, the ones not yet "Got it", your "Again" pile, or a priority set.
- Your marks, the order and your place are saved in the browser, so you continue where you stopped. Nothing is sent anywhere.
- After the first visit the site also opens without a connection.

## Running it locally

The page loads `deck.json`, so it needs a web server; opening `index.html` as a file will not work.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | Layout and colours, light and dark |
| `app.js` | Deck building, modes, marks, swipe and keyboard |
| `deck.json` | The cards |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | Offline support and the home-screen icon |

## Editing the cards

`deck.json` has a `cards` array, one card per line, in study order:

| Field | Meaning |
|---|---|
| `id` | Stable id; marks are saved under it, so do not change it for an existing card |
| `s`, `t`, `tid` | Section, topic name, topic id |
| `q` | The question |
| `a` | The answer to say aloud, plain text |
| `d` | More detail, HTML |
| `none`, `gap` | Optional: put the card in a priority set |

The names of the priority sets are in `sets` at the top of the file.
