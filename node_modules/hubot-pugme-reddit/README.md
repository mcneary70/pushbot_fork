# hubot-pugme-reddit

Pugme is the most important hubot script

See [`src/pugme.coffee`](src/pugme.coffee) for full documentation.

Forked from https://github.com/hubot-scripts/hubot-pugme which relies on a heroku app. This version pulls pugs from [reddit](https://www.reddit.com/r/pugs).

## Installation

In hubot project repo, run:

`npm install git+https://github.com/anupdhml/hubot-pugme-reddit --save`

Then add **hubot-pugme-reddit** to your `external-scripts.json`:

```json
[
  "hubot-pugme-reddit"
]
```

## Sample Interaction

```
user1>> hubot pug me
hubot>> http://imgur.com/PMlOozd
user1>> hubot pug bomb me
hubot>> http://imgur.com/6R752BY
hubot>> https://scontent-lhr3-1.xx.fbcdn.net/t31.0-8/13497991_789139941186193_5479447522257473316_o.jpg
hubot>> http://i.imgur.com/z7OfpjG.jpg
hubot>> http://imgur.com/PMlOozd
```
