'use strict';

const token = 'DepoBAHD8AP3CqTdZCEP4DGSCg7lYosO7q6NkWNZAUp8zHGqFMyfKNRsfapfxAa32IPlQ3QSKlaLu1XElAuSZAiAXEH7Y130vgZC6ORZADg8EzhH92WZALUiQpJkZAwcGTAVUKnmZC7CrAeiGJgDZBX9E5JpZBEbYJRpMeQfAZDZD';
const vtoken = 'project2dersiicin';
const appID = '405843006466437';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
var http = require('http');

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    var elapsedTimeSinceDeployment = (+new Date() - startMilliSeconds) / 1000;
    res.send('Server is deployed since: ' + new Date(elapsedTimeSinceDeployment * 1000).toISOString().substr(11, 8));
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error on webhook')
});

// Spin up the server
var startMilliSeconds;
app.listen(app.get('port'), function () {
    console.log('Server running on port', app.get('port'))
    startMilliSeconds = +new Date();
});

app.post('/webhook/', function (req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;
        if (event.message && event.message.text && sender != appID) {
            var text = event.message.text;
            //console.log("Gelen mesaj: " + text);'25.04.2017, IST -> ESB, 2 adults'
            returnMessage(sender, text);
            //sendTextMessage(sender, "You said: " + text.substring(0, 200));
        }
        if (event.postback) {
            var text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback: " + text.substring(0, 200), token);
        }
    }
    res.sendStatus(200)
});

function sendTextMessage(sender, text) {
    var messageData = {text: text};
    request({
        url: 'https://graph.facebook.com/v2.9/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages to the id: ' + sender + " \nAnd the error is " + error);
        } else if (response.body.error) {
            console.log('Error: sender: ' + sender + " text: " + text + response.body.error)
        } else {
            console.log("Message sent to sender: " + sender);
        }
    })
}


var API_KEY = "an641324822465322634866449518113";

//returnMessage(input);

function returnMessage(sender, input) {
    var flightDetails = input.split(", ");
    var date = flightDetails[0];
    var originAndDestination = flightDetails[1].split(" -> ");
    var origin = originAndDestination[0];
    var destination = originAndDestination[1];
    var personNumber = flightDetails[2].split(" ")[0];
    var day = date.split(".")[0];
    var month = date.split(".")[1];
    var year = date.split(".")[2];
    date = year + "-" + month + "-" + day;

    var requestLink = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0" +
        "/TR" +
        "/TRY" +
        "/tr-TR" +
        "/" + origin +
        "/" + destination +
        "/" + date +
        "?apikey=" +
        API_KEY;
    getFromSkyScanner(sender, requestLink, onFinish, personNumber, origin, destination);
}

function onFinish(sender, minPrice, personNumber, origin, destination) {
    sendTextMessage(sender, "You reserved " + personNumber + " tickets, each for "
        + minPrice + " and making a total of " + personNumber*minPrice + " TRY, from " + origin
        + " to " + destination);
}

function getFromSkyScanner(sender, requestLink, onFinish, personNumber, origin, destination) {
    http.get(requestLink, function (res) {
        var body = '';
        res.on('data', function (data) {
            body += data;
        });
        res.on('end', function () {
            var parsed = JSON.parse(body);
            var minPrice = parsed.Quotes[0].MinPrice;
            onFinish(sender, minPrice, personNumber, origin, destination);
        });
    }).on('error', function (e) {
        console.log("Error: " + e.message);
    });
}