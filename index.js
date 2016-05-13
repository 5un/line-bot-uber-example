var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('superagent');
var LineBot = require('line-bot-sdk');
var Uber = require('node-uber');

var client = LineBot.client({
  channelID: '1466956410',
  channelSecret: '2a43289185e1769dcc9f6684e44b380c',
  channelMID: 'ud17329fe10daf6988415791a917a6bb6'
});

var uberRedirectURL = 'https://sheltered-refuge-66681.herokuapp.com/uber_callback';
var uber = new Uber({
  client_id: 'H1IropVyJS3ExakiZ4ncYsG7jhgIhJef',
  client_secret: '8cdSFHQ-n9Aye8dyvbM1kQsWrMipcEMeLbI4gTwC',
  server_token: '-kuG1RcjtHta1ry_47orwyRK2EIxTgkf_cQ4bAtc',
  redirect_uri: uberRedirectURL, // Can open line again ?
  name: 'Inline',
  language: 'en_US' // optional, defaults to en_US
});

var users = {};  

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false, limit: 2 * 1024 * 1024 }));
app.use(bodyParser.json({ limit: 2 * 1024 * 1024 }));

app.post('/', function (req, res) {
  console.log(req.body.result);

  var receives = client.createReceivesFromJSON(req.body);
  _.each(receives, function(receive){
    
    if(receive.isMessage()){

      if(receive.isText()){

        if(receive.getText()==='me'){
          client.getUserProfile(receive.getFromMid())
            .then(function onResult(res){
              if(res.status === 200){
                var contacts = res.body.contacts;
                if(contacts.length > 0){
                  client.sendText(receive.getFromMid(), 'Hi!, you\'re ' + contacts[0].displayName);
                }
              }
            }, function onError(err){
              console.error(err);
            });
        } else if(receive.getText() === 'uber') {

          // check params

          var url = uber.getAuthorizeUrl(['history','profile', 'request', 'places'],
                                          uberRedirectURL /*+ '?line_mid=' + receive.getFromMid() */);
          console.log('uber authoize url = ' + url);

          client.sendText(receive.getFromMid(), 'Please authorize Uber via this link ' + url);

        } else {
          client.sendText(receive.getFromMid(), receive.getText());
        }

      }else if(receive.isImage()){
        
        client.sendText(receive.getFromMid(), 'Thanks for the image!');

      }else if(receive.isVideo()){

        client.sendText(receive.getFromMid(), 'Thanks for the video!');

      }else if(receive.isAudio()){

        client.sendText(receive.getFromMid(), 'Thanks for the audio!');

      }else if(receive.isLocation()){

        client.sendLocation(
            receive.getFromMid(),
            receive.getText() + receive.getAddress(),
            receive.getLatitude(),
            receive.getLongitude()
          );

      }else if(receive.isSticker()){

        // This only works if the BOT account have the same sticker too
        client.sendSticker(
            receive.getFromMid(),
            receive.getStkId(),
            receive.getStkPkgId(),
            receive.getStkVer()
          );

      }else if(receive.isContact()){
        
        client.sendText(receive.getFromMid(), 'Thanks for the contact');

      }else{
        console.error('found unknown message type');
      }
    }else if(receive.isOperation()){

      console.log('found operation');

    }else {

      console.error('invalid receive type');

    }

  });
  
  res.send('ok');
});

app.post('/uber_callback', function (req, res) {
  console.log('uber callback ' + request.query.code);

  uber.authorization({
    authorization_code: request.query.code
  }, function(err, access_token, refresh_token) {
    if (err) {
      console.error(err);
    } else {
      // store the user id and associated access token
      // redirect the user back to your actual app
      response.redirect('/web/index.html');
    }
  });

  res.send('ok');
});

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port'));
});