'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

var hp = 100;
var world = {
  "locations": [
    {
      "alias": "starting zone",
      "directions": {
        "north": "rigid structure",
        "south": "0",
        "east": "0",
        "west": "0"
      },
      "entities": [
        {
          "alias": "large organism",
          "desc": "It's a large organism with a several sets of fins"
        },
        {
          "alias": "swarm of small organisms",
          "desc": "A swarm of seemingly harmless crustacean-type creatures"
        }
      ]
    },
    {
      "alias": "rigid structure",
      "directions": {
        "north": "0",
        "south": "starting zone",
        "east": "0",
        "west": "0"
      },
      "entities": [],
      "items": [
        {
          "alias": "box"
        },
        {
          "alias": "big box"
        }
      ]
    }
  ]
};

var curr_zone = world.locations[0];

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
    for (var e in curr_zone.entities) {
        bsay += e.alias + ", ";
    }
    app.tell(bsay);
}

  let actionMap = new Map();
  actionMap.set('status', status_f);
  actionMap.set('attack', attack_f);
  actionMap.set('scan'), scan_f);

  app.handleRequest(actionMap);
});
