'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');

const map = {
  "name": "Super Maze",
  "meta": {
    "author": "Anurag Jain & Arvind Ravulavaru",
    "email": " *anurag91jain@gmail.com & arvind.ravulavaru@gmail.com",
    "tagline": "A Simple Text based Adventure game written in Javascript",
    "welcome": "Welcome to Maya - A pilot written to test the text based adventure game engine written in Javascript. The aim of the game is to find the exit gate and leave the maze."
  },
  "rooms": {
    "room1": {
      "alias": "Start Gate",
      "description": "You are on the other side of a burnt broken bridge, you look back to see the debris and a steady stream of water. You turn around and see a fountain. (hint : navigate around to explore [ex: `go north`])",
      "contextualHelp": "Look around and see if you can find something you can use",
      "actions": null,
      "exits": {
        "north": "room2",
        "east": "-1",
        "south": "room5",
        "west": "-1"
      },
      "objects": null,
      "enemies": null
    },
    "room2": {
      "alias": "A Fountain",
      "description": "You are near the fountain. It is in front of a huge mansion. There is a half filled bottle of water just besides it",
      "contextualHelp": "Water is helpful when you are dehydrated from all the walking around",
      "actions": null,
      "exits": {
        "north": "room6",
        "east": "room3",
        "south": "room1",
        "west": "-1"
      },
      "objects": {
        "bottle": {
          "actions": null
        }
      },
      "enemies": null
    },
    "room3": {
      "alias": "Forest",
      "description": "There are trees all around you. There is a sword lying besides you.",
      "contextualHelp": "You can use swords to kill enemies",
      "actions": null,
      "exits": {
        "north": "room3",
        "east": "room3",
        "south": "room3",
        "west": "room1"
      },
      "objects": {
        "sword": {
          "actions": "take"
        }
      },
      "enemies": null
    },
    "room4": {
      "alias": "Forest",
      "description": "Tall trees are all around you. A speck of light is coming from the south.",
      "contextualHelp": "Forest forest everywhere.. ",
      "actions": null,
      "exits": {
        "north": "-1",
        "east": "-1",
        "south": "room7",
        "west": "room1"
      },
      "objects": null,
      "enemies": null
    },
    "room5": {
      "alias": "Forest",
      "description": "There are trees all around you",
      "contextualHelp": "Forest forest everywhere.. ",
      "actions": null,
      "exits": {
        "north": "room1",
        "east": "room7",
        "south": "room4",
        "west": "room8"
      },
      "objects": null,
      "enemies": null
    },
    "room6": {
      "alias": "Mansion",
      "description": "You have reached the entrance of the huge mansion. The door is locked and all the windows in the front are bolted",
      "contextualHelp": "Huge mansions are a treasure of objects :)",
      "actions": {
        "door": "The door is shut",
        "windows" : "The windows are bolted"
      },
      "exits": {
        "north": "-1",
        "east": "-1",
        "south": "room2",
        "west": "-1"
      },
      "objects": null,
      "enemies": null
    },
    "room7": {
      "alias": "River",
      "description": "You are standing on the banks of a fast flowing river.",
      "contextualHelp": "Ahh!! If only I knew where to go",
      "actions": null,
      "exits": {
        "north": "room4",
        "east": "-1",
        "south": "room7",
        "west": "-1"
      },
      "objects": null,
      "enemies": null
    }
  },
    "room8": {
      "alias": "Exit gate",
      "description": "You are at the exit gates!! You finally made it!! Thanks for playing Super Maze",
      "contextualHelp": "",
      "actions": null,
      "isExitRoom" : "true",
      "exits": {
        "north": "-1",
        "east": "-1",
        "south": "-1",
        "west": "-1"
      },
      "objects": null,
      "enemies": null
    }
  }
};


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

// var map = JSON.parse(fs.readFileSync('../asets/maps/super_maze.json', 'utf8'));
var current = map.rooms['room1'];

function attack_f (app) {
    let target = current.enemies[app.getArgument['any']]
    if (current.enemies != null && target) {
        app.ask('Attacking ' + target);
    } else {
        app.ask('No enemies...');
    }
}

function navigate_f (app) {
    let direction = current.exits[app.getArgument['any']];
    if (direction != '-1') {
        current = map.rooms[direction];
        app.ask('Travelling to ' + direction);
    } else {
        app.ask('No such destination.');
    }
}

function heal_f (app) {

}

function look_f (app) {
    let target = app.getArgument['any'];
    console.log(JSON.stringify(current));
    if (target == null) {
        app.ask(current.description);
    } else if (target) {
        app.ask('Coming soon');
    } else {
        app.ask('No such thing...');
    }
}

function take_f (app) {
    let target = current.objects[app.getArgument('any')];
    if (target) {
        app.ask('Grabbing ' + target + '...');
    } else {
        app.ask('No such ' + target + ' here...');
    }
}

function interact_f (app) {
    let action = map.actions[app.getArgument('any')];
    if (target) {
        app.ask(action);
    } else {
        app.ask('No such thing ' + target + '...');
    }
}

  let actionMap = new Map();
  actionMap.set('attack', attack_f);
  actionMap.set('navigate', navigate_f);
  actionMap.set('heal', heal_f);
  actionMap.set('look', look_f);
  actionMap.set('take', take_f);
  actionMap.set('interact', interact_f);

  app.handleRequest(actionMap);
});
