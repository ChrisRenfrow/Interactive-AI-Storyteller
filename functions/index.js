'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

var hp = 100;
var entities = {[
    {
        alias:  "whallioop",
        far_desc: "a large lifeform",
        detail: "A large, oblong creature with several sets of fins and a large mouth, it doesn't appear to have teeth, thank goodness."
    }, {
        alias: "krimples",
        far_detail: "a swarm of small lifeforms",
        detail: "These small crustacean type creatures move swiftly and aggressively amongst themselves, but I'm sure they're harmless. I hope they are..."
    }
]};

var locations = {[
    {
        alias: "starting zone",
        directions: [
            north: "rigid structure",
            south: "0",
            east: "0",
            west: "0"
        ]
    }, {
        alias: "rigid structure",
        directions: [
            north: "0",
            south: "starting zone",
            east: "0",
            west: "0"
        ]
    }
]};

exports.underwaterAdventure = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

// Make a silly name
//  function makeName (app) {
//    let number = app.getArgument(NUMBER_ARGUMENT);
//    let color = app.getArgument(COLOR_ARGUMENT);
//    app.tell('Alright, your silly name is ' +
//      color + ' ' + number +
//      '! I hope you like it. See you next time.');
//  }


function status_f (app) {
    if (hp == 100)
	   app.tell('Our status is well, okay.');
}

function attack_f (app) {
	hp = hp - 10;
	app.tell('Torpedo barrel misaligned! Damage taken!');
}

function scan_f (app) {
    var bsay = "Looks like we have... ";
    for (var e in entities) {
        bsay += e.far_detail + ", ";
    }
    app.tell(bsay);
}

  let actionMap = new Map();
  actionMap.set('status', status_f);
  actionMap.set('attack', attack_f);
  actionMap.set('scan'), scan_f);

  app.handleRequest(actionMap);
});
