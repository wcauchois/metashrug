// Required envs: PORT, SLACK_TOKENS, WEBHOOK_URL

var express = require('express'),
    util = require('util'),
    request = require('request'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    _ = require('lodash');

var app = express();

app.disable('etag'); // Don't send 304s for everything
app.use(morgan('short'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.status(403).send('Forbidden');
});

app.get('/health', function(req, res) {
  res.send('OK');
});

var exitHandler = function(req, res) { process.exit(0); };
app.get('/quitquitquit', exitHandler);
app.get('/abortabortabort', exitHandler);

var baseShrug = "¯\\_(ツ)_/¯";
var shrugTemplate = "¯\\_(%s)_/¯";

var slackTokens = process.env['SLACK_TOKENS'].split('|');

function authedHandler(handler) {
  return function(req, res) {
    util.log("Got: " + JSON.stringify(req.body));
    if (slackTokens.indexOf(req.body['token']) < 0) {
      res.status(403).send('Forbidden');
    } else {
      res.set('Content-Type', 'text/plain');
      handler(req, res);
    }
  };
}

app.post('/shrugemoji', authedHandler(function(req, res) {
  var emoji = req.body.text.trim();
  var shrugToSend = util.format(shrugTemplate, emoji);
  var emojiForBot = ':sweat_smile:'
  if (/^:[a-zA-Z_\-0-9]*:$/.test(emoji)) {
    emojiForBot = emoji;
  }
  sendSlack(req.body, emojiForBot, shrugToSend, null, function(err) {
    if (err) {
      res.send(err.message);
    } else {
      res.send('');
    }
  });
}));

app.post('/shrug', authedHandler(function(req, res) {
  var n = parseInt(req.body.text.trim());
  if (isNaN(n)) {
    res.send("Please give me a number.");
  } else if (n < 1) {
    res.send("Must send at least 1 shrug.");
  } else if (n > 20) {
    res.send("That's way too many shrugs, are you insane?");
  } else {
    var shrugToSend = baseShrug;
    n--;
    for (; n > 0; n--) {
      shrugToSend = util.format(shrugTemplate, shrugToSend);
    }
    sendSlack(req.body, ':sweat_smile:', shrugToSend, null, function(err) {
      if (err) {
        res.send(err.message);
      } else {
        res.send('');
      }
    });
  }
}));

function sendSlack(params, emoji, text, attachments, cb) {
  var payload = {'username': params['user_name'], 'icon_emoji': emoji, 'channel': params['channel_id']};
  if (text) payload['text'] = text;
  if (attachments) payload['attachments'] = attachments;
  request({
    url: process.env['WEBHOOK_URL'],
    form: {'payload': JSON.stringify(payload)},
    method: 'POST'
  }, function(err, response, body) {
    if (err || response.statusCode !== 200) {
      var newErr = new Error("Error posting to Slack: " + ((err && err.message) ||
        ("Got code " + response.statusCode)) + "\n\n" + body);
      util.log(newErr.message);
      cb && cb(newErr);
    } else {
      cb(null);
    }
  });
}

if (require.main === module) {
  var port = process.env['PORT'] || 3000;
  app.listen(port, function() {
    util.log('Started on port ' + port);
  });
}

