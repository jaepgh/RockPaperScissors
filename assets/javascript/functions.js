//FIREBASE CREDENTIALS
var config = {
    apiKey: "AIzaSyBn0AmZR4l1EoPNuuhMK3dW77fkGsWHlL4",
    authDomain: "rock-paper-scissors-3fe77.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-3fe77.firebaseio.com",
    projectId: "rock-paper-scissors-3fe77",
    storageBucket: "rock-paper-scissors-3fe77.appspot.com",
    messagingSenderId: "748371527401"
};

firebase.initializeApp(config);

//VARIABLES
var turn = 0;
var logged = false;
var chatRef = firebase.database().ref("/chat");
var playersRef = firebase.database().ref("/players");
var database = firebase.database().ref();

var players = [];
var player = {
    id: 1,
    name: '',
    wins: 0,
    losses: 0,
    choice: '',
    choice_selected: false
}

$(document).ready(function () {
    //START THE GAME
    $('#start-btn').on('click', function () {
        //VALIDATE ENTRY
        if ($('#nickname').val()) {
            //SHOW GAME SCREEN
            proceedToTheGame($('#nickname').val().trim());
        } else {
            //SHOW ERROR MESSAGE
            informationModal('Input Error!', 'You need to enter your Nickname!');
        }
        clearField('#nickname');
    });

    $('.far').on('click', function () {
        $(this).siblings().hide();
        updateSelection($(this).attr('value'));
    })

    $('#chat-btn').on('click', function () {
        sendMessage($('#chat-text').val().trim());
        clearField('#chat-text');
    })
});

database.on('value', function (snap) {
    if (snap.val()) {
        if (!Array.isArray(snap.val().players)) {
            players = [];
        } else {
            players = snap.val().players;
            turn = snap.val().turn;

            //Check if the user is one of the current players
            if (logged) {
                players.forEach(element => {
                    $('#player' + element.id + 'name').text(element.name);
                    $('#wins-' + element.id).text(element.wins);
                    $('#losses-' + element.id).text(element.losses);


                    if (player.id !== element.id) {
                        showPlayer(element.id);
                    }
                });
            }
        }
    }

});

//MAIN FUNCTIONS

//Prepare the game
function proceedToTheGame(nickname) {
    var createdPlayer = createPlayer(nickname);
    if (createdPlayer > 0) {
        //Show current player rps selector
        $('#rps-selector-' + createdPlayer).css('visibility', 'visible');

        //Show the player
        showPlayer(createdPlayer);
    }
}

//Modify the player object
function createPlayer(nickname) {
    if (admitMorePlayers()) {
        player.name = nickname;
        players.push(player);
        player.id = players.length;

        //add player to the database
        addPlayer();

        return player.id;
    } else {
        //All the players are active 
        informationModal('Error!', 'All the players are active. Please try again latter');
        return 0;
    }
}

//Shows the corresponding player
function showPlayer(createdPlayer) {
    $('#player-screen').hide();
    $('#game-screen').delay(300).fadeIn('slow');

    $('#waiting-pl-' + createdPlayer).hide();
    $('#active-pl-' + createdPlayer).delay(600).fadeIn('slow');
}

function updateSelection(selection) {
    player.choice = selection;
    player.choice_selected = true;

    //Update current player choice
    var choiseRef = playersRef.child(player.id - 1);
    choiseRef.update({
        "choice": selection,
        "choice_selected": true
    }).then(function () {
        //Update current turn
        var temp = (player.id === 1) ? 2 : 1;

        database.update({
            "turn": temp
        });

        if (bothPlayerSelected()) {
            defineWiner();
        } else {
            waitingForPlayer(temp);
        }
    });
}

function waitingForPlayer(playerNumber) {
    console.log('Waiting for player ' + playerNumber);
}

function bothPlayerSelected() {
    if (players.length < 2) {
        return false;
    } else {
        var selected = 0;

        players.forEach(element => {
            if (element.choice_selected) {
                selected++;
            }
        });
        return selected === players.length;
    }
}

function defineWiner(){
    if () {
        
    } else {
        
    }
}



//AUXILIAR FUNCTIONS

//Show a modal with a personalized message.
function informationModal(outputTitle, outputMessage) {
    $('.modal-title').text(outputTitle);
    $('#modal-text').text(outputMessage);
    $('#infoModal').modal('show');
}

//Clean the user entrey for the Nickname
function clearField(element) {
    $(element).val('');
}

//Show message on the chat
function showMessage(name, message) {
    var listElement = $('<li>');
    listElement.html('<strong>' + name + '</strong>: ' + message);
    $('#message-area').append(listElement);
}

//Check if the game is complete
function admitMorePlayers() {
    if (!Array.isArray(players)) {
        players = [];
        return true;
    } else {
        return players.length < 2;
    }

}

//DATA MANIPULATION FUNCTIONS
function addPlayer() {
    logged = true;
    database.set({
        players: players,
        turn: turn

    })
}

function sendMessage(pmessage) {

    chatRef.push().set({
        player_name: player.name,
        message: pmessage
    })
}

chatRef.on("child_added", function (snap) {
    var messageRow = snap.val();
    showMessage(messageRow.player_name, messageRow.message);
})