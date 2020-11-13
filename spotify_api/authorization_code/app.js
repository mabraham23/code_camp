/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '8bcb169f90554b209a351f9016ec7b04'; // Your client id
var client_secret = 'b6e3d58e0f884aed8fa358beea0aed3e'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var global_token = {
  token: ""
}
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        global_token.token = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': global_access.token, 
      });
    }
  });
});

app.get('/current_track', function(req, res) {

  // requesting access token from refresh token
  // var refresh_token = req.query.refresh_token;
  //11dFghVXANMlKmJXsNCbNl
  //https://api.spotify.com/v1/audio-analysis/{id}
  // var token = body.access_token;
  var authOptions = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: {
        'Authorization': 'Bearer ' + 'BQDoHGpnfmJvEvqYrGFHoPZ2x1Zas44iTawyHMG2aibcwwgh9JsnT778YLoY5-7ao9BzaB8d6LWNSPW2WDV5F3ofn5J3SpOov3jgUjWtUy7UvLGpx7B_MOimQyTbxTaDo0Wm-lp1kmut6S8x4J0XMhqlOrzXqqiKjcWNSHFlzw', 
    },
    // headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    // form: {
    //   grant_type: 'refresh_token',
    //   refresh_token: refresh_token
    // },
    json: true
  };
  // console.lot(authOptions.headers);

  request.get(authOptions, function(error, response, body) {
    console.log(response.statusCode);
    if (!error && response.statusCode === 200) {
      // console.log(body);
      console.log(body.item.artists[0].name);
      console.log(body.item.name);
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);