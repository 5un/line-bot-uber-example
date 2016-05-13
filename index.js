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

var lineUsers = {};  

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false, limit: 2 * 1024 * 1024 }));
app.use(bodyParser.json({ limit: 2 * 1024 * 1024 }));

var authorizeUber = function(lineBot, fromMid){

  lineBot.sendText(fromMid, 'Please authorize Uber via this link ' + 
                                          uber.getAuthorizeUrl(['history','profile', 'request', 'places'],
                                          uberRedirectURL + '?line_mid=' + fromMid));

};

app.post('/', function (req, res) {
  console.log(req.body.result);

  var receives = client.createReceivesFromJSON(req.body);
  _.each(receives, function(receive){
    
    if(receive.isMessage()){

      if(receive.isText()){

        var segments = receive.getText().split(/\s+/);

        if(segments.length > 0 && segments[0] === '@uber'){

          var needAuthorization = false;
          var lineUser = lineUsers[receive.getFromMid()];
          if(lineUser === undefined){

            authorizeUber(client, receive.getFromMid);

          }else if(segments[1] === 'estimate'){

            //TODO request ride

          }else if(segments[1] === 'ride'){

            //TODO request ride

          }else {

            // Just show out info
            uber.user.getProfile([lineUser.uberAccessToken], function (err, res) {
              if (err) {console.log(err);
                // if it's auth error, try reauthorize with refresh token
              }else {
                console.log(res);
                // send info back to user
              }
            });

          }

        }else if(receive.getText()==='me'){
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
        } else {
          client.sendText(receive.getFromMid(), receive.getText());
        }

      }else if(receive.isLocation()){

        client.sendLocation(
            receive.getFromMid(),
            receive.getText() + receive.getAddress(),
            receive.getLatitude(),
            receive.getLongitude()
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

app.get('/uber_callback', function (req, res) {
  console.log('uber callback ' + req.query.code);

  uber.authorization({
    authorization_code: req.query.code
  }, function(err, access_token, refresh_token) {
    if (err) {
      console.error(err);
    } else {
      // store the user id and associated access token
      // redirect the user back to your actual app
      //res.redirect('/web/index.html');

      // Try to open line again
      if(req.query.line_mid){
        lineUsers[req.query.line_mid] = {
          mid: req.query.line_mid,
          uberAccessToken: access_token,
          uberRefreshToken: refresh_token
        }
      }
    }
  });

  res.send('ok');
});

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port'));
});