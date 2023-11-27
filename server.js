import express from "express";
import path from "path";
import querystring from "querystring";
import request from "request";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from "cookie-parser";
import RPC from "discord-rpc";

import * as config from "./config.js";

const rpc = new RPC.Client({ transport: "ipc" });
const scopes = ['rpc', 'rpc.api'];

let CURRENT_TRACK_ID = "";

var stateKey = 'spotify_auth_state';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

const prepareArtists = (artists) => {
  const names = artists.map((item) => item.name)
  return names.join(", ");
}

async function updateRPC(track) {
  if (!(track && track.item.id !== CURRENT_TRACK_ID)) return;

  CURRENT_TRACK_ID = track.item.id;
  
  const COVER_URL = track.item.album.images[1].url;
  const TRACK_TITLE = track.item.name;
  const ALBUM_TITLE = track.item.album.name;
  const ARTISTS = prepareArtists(track.item.artists);
  const TRACK_URL = track.item.external_urls.spotify;

  rpc.setActivity({
      state: ARTISTS,
      details: TRACK_TITLE,
      largeImageKey: COVER_URL,
      largeImageText: ALBUM_TITLE,
      buttons: [
          { label:"Слушать", url: TRACK_URL }
      ]
  });

  log("RPC UPDATED");
  return;
};

const log = (msg) => {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
};

const generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.use(express.static(path.join(__dirname, "dist")));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: config.CLIENT_ID,
      scope: scope,
      redirect_uri: "http://localhost:8888/callback",
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;

  res.clearCookie(stateKey);
  var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: "http://localhost:8888/callback",
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(config.CLIENT_ID + ':' + config.CLIENT_SECRET).toString('base64'))
      },
      json: true
  };

  request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

          var access_token = body.access_token,
          refresh_token = body.refresh_token;

          var options = {
              url: 'https://api.spotify.com/v1/me',
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            log("SUCCESSFULLY LOGGED AS " + response.toJSON().body.display_name);
          });

          res.cookie("spotify-token", access_token);
          res.cookie("token-updated", Date.now());

        // we can also pass the token to the browser to make requests from there
          res.redirect('/');
      } else {
        console.log(response);
        res.redirect('/?' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
);

app.post("/updaterpc", (req, res) => {
  if(!req.body) return res.sendStatus(400);
  updateRPC(req.body.body);
  res.sendStatus(200);
})

rpc.on("ready", async () => {
  log('LOGGED DISCORD');
})

rpc.login({ clientId: config.DISCORD_CLIENT_ID });
  
app.listen(8888);
console.log("LISTENING ON http://localhost:8888")