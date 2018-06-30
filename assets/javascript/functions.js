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
var playerTurn = firebase.database().ref("/turn");
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
//---------------------------------------------------------//
//------------------------FUNCTIONS------------------------//
//---------------------------------------------------------//
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
        $(this).css("pointer-events", "none");
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
                snap.val().players.forEach(element => {
                    $('#player' + element.id + 'name').text(element.name);
                    $('#wins-' + element.id).text(element.wins);
                    $('#losses-' + element.id).text(element.losses);

                    if (player.id !== element.id) {
                        showPlayer(element.id);
                    }
                });

                if (!bothPlayerSelected()) {
                    waitingForPlayer();
                }
            }
        }
    }
});

playerTurn.on('value', function (snap) {
    if (logged) {
        if (bothPlayerSelected()) {
            defineWiner();
            //Update Firebase
            database.update({
                "turn": 0
            })
            setTimeout(newGame, 5000);
        }
    }
});

playersRef.on("child_removed", function (snapshot) {
    var index = (player.id === 1) ? 2 : 1;
    hidePlayer(index);
});

//On window unload, remove the user from the database
$(window).on("unload", function () {
    //Remove from local list
    removeCurrentPlayer();

    //Remove from the Database
    database.update({
        "players": players,
        "turn": 0
    })

    //Message to the chat
    sendMessage(System + ' has disconnected.');
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
        var tempId = getAvaliableId();
        player.name = nickname;
        players.push(player);
        player.id = tempId;

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
    //Get current player
    var index = currentPlayerIndex(player.id);

    //Update local player 
    player.choice = selection;
    player.choice_selected = true;


    players[index] = player;
    database.update({
        "players": players,
    }).then(function () {
        //Update current turn
        var temp = (player.id === 1) ? 2 : 1;

        database.update({
            "turn": temp
        })
    });
}

function waitingForPlayer() {
    if (nonePlayerSelected()) {
        //Do nothing
    } else {
        updateMessageBoard();
    }
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

function nonePlayerSelected() {
    if (players.length < 1) {
        return false;
    } else {
        var selected = 0;
        players.forEach(element => {
            if (!element.choice_selected) {
                selected++;
            }
        });

        return selected === players.length;
    }
}

function defineWiner() {
    var otherPlayer = getOtherPlayer(player.id);

    if ((player.choice === 'rock') && (otherPlayer.choice === 'paper')) {
        //You lose
        increaseLosses();
        updateBoard('You lose, ' + otherPlayer.name + ' won!');
    } else if ((player.choice === 'rock') && (otherPlayer.choice === 'scissors')) {
        //You won
        increaseWins();
        updateBoard('Congrats, you won!');
    } else if ((player.choice === 'paper') && (otherPlayer.choice === 'scissors')) {
        //You lose
        increaseLosses();
        updateBoard('You lose, ' + otherPlayer.name + ' won!');
    } else if ((player.choice === 'paper') && (otherPlayer.choice === 'rock')) {
        //You won
        increaseWins();
        updateBoard('Congrats, you won!');
    } else if ((player.choice === 'scissors') && (otherPlayer.choice === 'rock')) {
        //You lose
        increaseLosses();
        updateBoard('You lose, ' + otherPlayer.name + ' won!');
    } else if ((player.choice === 'scissors') && (otherPlayer.choice === 'paper')) {
        //You won
        increaseWins();
        updateBoard('Congrats, you won!');
    } else {
        //Tie Game
        updateBoard('Tie Game!');
    }

    //Preparing for next match
    //Set both players to selected no.
    players.forEach(element => {
        element.choice_selected = false;
    });

    //Update Firebase
    database.update({
        "players": players,
    })

}

function increaseWins() {

    //Update local Array
    players.forEach(element => {
        if (element.id === player.id) {
            //Local Player
            player.wins += 1;
            //Array
            element.wins += 1;
        } else {
            element.losses += 1;
        }
    });
}

function increaseLosses() {
    players.forEach(element => {
        if (element.id === player.id) {
            //Local Player
            player.losses += 1;
            //Array
            element.losses += 1;
        } else {
            element.wins += 1;
        }
    });
}

function updateMessageBoard() {
    if (turn === player.id) {
        // Waiting for you!
        updateBoard('Waiting for you!');
    } else {
        if (turn === 0) {
            //Do nothing
        } else {
            updateBoard('Waiting for your Opponent!');
        }
    }
}
function newGame() {
    $('#roundResult').empty();
    $('.far').each(function () {
        $(this).show();
        $(this).css("pointer-events", "auto");
    });
}

//AUXILIAR FUNCTIONS

//Return the second player
function getOtherPlayer() {
    var temp;
    players.forEach(element => {
        if (element.id !== player.id) {
            temp = element;
        }
    });
    return temp;
}

function currentPlayerIndex(pid) {
    var temp = -1;

    for (let index = 0; index < players.length; index++) {
        if (players[index].id === pid) {
            temp = index;
        }

    }

    return temp;
}

//Update HTML of Game message board
function updateBoard(message) {
    $('#roundResult').empty();

    var h2Tag = $('<h2>');
    h2Tag.addClass('text-center');
    h2Tag.addClass('p-4');
    h2Tag.text(message);

    $('#roundResult').append(h2Tag);
    $('#roundResult').css('visibility', 'visible');
}


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

//Base on the existing or not player provides an id (1 or 2) 
function getAvaliableId() {
    if (players.length > 0) {
        return players[0].id === 1 ? 2 : 1;
    } else {
        return 1
    }
}

//Remove the current player from the existing array
function removeCurrentPlayer() {
    var pos = 0;

    for (let index = 0; index < players.length; index++) {
        if (players[index].id === player.id) {

            pos = index;
        }
    }

    players.splice(pos, 1);
}

function hidePlayer(pid) {
    $('#waiting-pl-' + pid).delay(300).fadeIn('slow');
    $('#active-pl-' + pid).hide();
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