// Required envs: PORT, SLACK_TOKENS, WEBHOOK_URL

const express = require('express');
     util = require('util'),
     request = require('request-promise-native'),
     bodyParser = require('body-parser'),
     morgan = require('morgan');

const app = express();

app.disable('etag'); // Don't send 304s for everything
app.use(morgan('short'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get(['/', '/health'], (req, res) => {
  res.send('OK');
});

app.post(['/quitquitquit', '/abortabortabort'], (req, res) => {
  res.send('');
  process.exit(0);
});

const baseShrug = "¯\\_(ツ)_/¯";
const shrugTemplate = "¯\\_(%s)_/¯";

const slackTokens = process.env['SLACK_TOKENS'].split(',');

// Verifies the slack token before invoking handler.
function authedHandler(handler) {
  return (req, res, next) => {
    util.log("Got: " + JSON.stringify(req.body));
    if (slackTokens.indexOf(req.body['token']) < 0) {
      res.status(403).send('Forbidden');
    } else {
      res.set('Content-Type', 'text/plain');
      // catch is required so async errors propagate.
      handler(req, res).catch(next);
    }
  };
}

app.post('/shrugemoji', authedHandler(async function(req, res) {
  const emoji = req.body.text.trim();
  const shrugToSend = util.format(shrugTemplate, emoji);
  const emojiForBot = ':sweat_smile:'
  if (/^:[a-zA-Z_\-0-9]*:$/.test(emoji)) {
    emojiForBot = emoji;
  }
  await sendSlack(req.body, emojiForBot, shrugToSend);
  res.send('');
}));

app.post('/metashrug', authedHandler(async function(req, res) {
  let n = parseInt(req.body.text.trim());
  if (isNaN(n)) {
    res.send("Please give me a number.");
  } else if (n < 1) {
    res.send("Must send at least 1 shrug.");
  } else if (n > 20) {
    res.send("That's way too many shrugs, are you insane?");
  } else {
    let shrugToSend = baseShrug;
    n--;
    for (; n > 0; n--) {
      shrugToSend = util.format(shrugTemplate, shrugToSend);
    }
    await sendSlack(req.body, ':sweat_smile:', shrugToSend);
    res.send('');
  }
}));

async function sendSlack(params, emoji, text, attachments) {
  const payload = {
    'username': params['user_name'],
    'icon_emoji': emoji,
    'channel': params['channel_id']
  };
  if (text) {
    payload['text'] = text;
  }
  if (attachments) {
    payload['attachments'] = attachments;
  }
  await request({
    url: process.env['WEBHOOK_URL'],
    form: {'payload': JSON.stringify(payload)},
    method: 'POST'
  });
}

if (require.main === module) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    util.log('Started on port ' + port);
  });
}

