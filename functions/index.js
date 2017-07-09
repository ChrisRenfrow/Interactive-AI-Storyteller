'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

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
var hp = 100;
var repair_kit = 2;

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
	   app.ask('Our status is well, okay.');
}

function attack_f (app) {
	hp = hp - 10;
	app.ask('<speak>Atacking...<break time="1s"/>Torpedo barrel misaligned! '+
                'Damage taken!</speak>');
}

function navigate_f (app) {
    let directions = {north:1,south:0,east:0,west:1};
    let target = app.getArgument('any');
    if (directions[target]) {
        app.ask('Alright, we\'re going ' + target);
    } else {
        app.ask('We can\'t go that way!');
    }
}

function repair_f (app) {
    if (repair_kit != 0) {
        hp = hp + 10;
        repair_kit = repair_kit - 1;
    	app.ask('<speak>Repairing...<break time="1s"/>What\'s next Captain?</speak>');
    } else {
        app.ask('<speak>It seems we have no repair kits...<break time="1s"/>What\'s next Captain?</speak>');
    }
}

function scan_f (app) {
    let bsay = '<speak>Looks like we have something... ';
    for (var e in curr_zone.entities) {
        bsay += e.alias + ', ';
    }
    bsay += ' What\'s next Captain?</speak>'
    app.ask(bsay);
}

function self_destruct_f (app) {
    app.tell("Well, goodbye cruel world...");
}

function speak_f (app) {
    let target = app.getArgument('any');
    if (tarket == 'fish') { // Test value is test
        app.ask('Comunicating with ' + target + '...');
    } else {
        app.ask('No such ' + target + ' in range...');
    }
}

function take_f (app) {
    let target = app.getArgument('any');
    if (target == 'bagel') {
        app.ask('Grabbing ' + target + '...');
    } else {
        app.ask('No such ' + target + ' here...');
    }
}

function interact_f (app) {
    let target = app.getArgument('any');
    if (target == 'boat') {
        app.ask('Touching ' + target + '...');
    } else {
        app.ask('No such ' + target + '...');
    }
}

  let actionMap = new Map();
  actionMap.set('status', status_f);
  actionMap.set('attack', attack_f);
  actionMap.set('repair', repair_f);
  actionMap.set('scan', scan_f);
  actionMap.set('speak', speak_f);
  actionMap.set('take', take_f);
  actionMap.set('interact', interact_f);
  actionMap.set('self_destruct', self_destruct_f);

  app.handleRequest(actionMap);
});
