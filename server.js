const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Import the path module
const fs = require('fs');
const uuid = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT;
const server = http.createServer(app);
const io = socketIo(server);

const bodyParser = require('body-parser');


const { connectToMongoDB, insertDrawingData, getRandomDrawingData, getCountRandomDrawingData, registerUser, googleSignIn, updateUserDetails, updateUserRewards, getUserDetails} = require('./DB')


app.use(express.static(path.join(__dirname, 'public')));
// Increase payload size limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
//route to handle requests for the home page
app.get('/', (req, res) => {
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, 'public', '/assets/templates/game_modes.html'));
});
app.get('/settings', (req, res) => {
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, 'public', '/assets/templates/settings.html'));
});
app.get('/play', (req, res) => {
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, 'public', '/assets/templates/play.html'));
});
// api to register user
app.post('/register', async (req, res) => {
    try {
        const { username, name } = req.body;
        let new_image = 'media/images/avatars/panda.svg';
        const result = await registerUser(username, name, new_image);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})
// api to register user
app.post('/googlesignin', async (req, res) => {
    try {
        const { username, name, imageurl } = req.body;
        const result = await googleSignIn(username, name, imageurl);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})
// api to update user
app.post('/updateUser', async (req, res) => {
    try {
        const { username , newUsername, newName, newImageUrl} = req.body;
        const result = await updateUserDetails(username , newUsername, newName, newImageUrl);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// api to update rewards
app.post('/updateRewards', async (req, res) => {
    try {
        const { username , newRewards} = req.body;
        const result = await updateUserRewards(username , newRewards);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

// api to update rewards
app.post('/getUserDetails', async (req, res) => {
    try {
        const { username } = req.body;
        const result = await getUserDetails(username);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})
// api to get random word
app.get('/random_words', (req, res) => {
    res.json(getRandomWords('word.txt', 3));
})
// api to add drawing data
app.post('/add_drawing_data', async (req, res) => {
    try {
        const { word, data } = req.body;
        const result = await insertDrawingData({ word, data });
        if (result.success) {
            res.status(200).json({ message: 'Drawing Data Inserted' });
        }
        else {
            res.status(500).json({ message: 'Drawing Data Insertion failed' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// api to get random drawing data
app.post('/getDrawingData', async (req, res) => {
    try {
        const result = await getRandomDrawingData();
        if (result.success) {
            res.status(200).json({ message: 'Success', data: result.data });
        }
        else {
            res.status(500).json({ message: 'Failed To Get Data' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

// api to get n random drawing data
app.post('/getnDrawingData', async (req, res) => {
    try {
        const { count } = req.body
        const result = await getCountRandomDrawingData(count);
        if (result.success) {
            res.status(200).json({ message: 'Success', data: result.data });
        }
        else {
            res.status(500).json({ message: 'Failed To Get Data' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const activeRooms = {};
// When a room is created
app.post('/createRoom', (req, res) => {
    const { roundTime, numberOfRounds } = req.body; // Extract details from the request body
    // Generate a unique room ID
    const roomID = generateRoomID();

    // Store room details with creation timestamp
    const room = {
        id: roomID,
        createdAt: Date.now(),
        roundTime: roundTime,
        numberOfRounds: numberOfRounds,
        currentWord: "",
        currentDrawer: "",
        currentRound: 0,
        gameStarted: false,
        players: []
    };
    activeRooms[roomID] = room;

    // Schedule expiration timer for 15 minutes
    // setTimeout(() => {
    //     // Check if the room is still active
    //     if (activeRooms[roomID]) {
    //         // Room has expired, remove it from active rooms
    //         delete activeRooms[roomID];
    //         // Notify clients that the room has expired
    //         io.to(roomID).emit('roomExpired');
    //     }
    // }, 15 * 60 * 1000); // 15 minutes in milliseconds

    // Send the room ID back to the client
    res.json({ roomID });
});
const maxRoomSize = 8;
const countdownTimes = {}; // Store countdown times for each room
let countdownInterval;
// Function to find or create a room and join it
function joinRandomRoom(playerId) {
    let roomToJoin;

    // Find a room with available space or create a new one
    for (const roomId in activeRooms) {
        if (activeRooms[roomId].length < maxRoomSize) {
            roomToJoin = roomId;
            break;
        }
    }

    if (!roomToJoin) {
        roomToJoin = createRoom();
    }

    // Add the player to the room
    activeRooms[roomToJoin].push(playerId);

    return roomToJoin;
}

// Function to create a new room
function createRoom() {
    const roomId = generateRoomId();
    activeRooms[roomId] = [];
    return roomId;
}

// Function to generate a random room ID
function generateRoomId() {
    // Generate a v4 (random) UUID
    return uuid.v4();
}
function generateRoomID() {
    // Generate a random alphanumeric ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomID = '';
    for (let i = 0; i < 6; i++) {
        roomID += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return roomID;
}

function getRandomWords(filePath, count) {
    try {
        // Read the contents of the file
        const words = fs.readFileSync(filePath, 'utf8').split('\n').filter(word => word.trim() !== '');

        // Initialize an array to store the randomly selected words
        const randomWords = [];

        // Generate and store 'count' number of random words
        for (let i = 0; i < count; i++) {
            // Generate a random index to select a word from the array
            const randomIndex = Math.floor(Math.random() * words.length);
            // Add the randomly selected word to the array
            randomWords.push(words[randomIndex].toLowerCase());
        }

        // Return the array of randomly selected words
        return randomWords;
    } catch (error) {
        console.error('Error reading file or generating random word:', error);
        return null;
    }
}
const drawerIndices = {};

// Function to select a drawer for the next round
function selectDrawer(roomID) {
    const room = activeRooms[roomID];
    const players = room.players;

    // Get the current drawer index for this room, or initialize it to 0 if it's undefined
    let drawerIndex = drawerIndices[roomID] || 0;

    // Increment the drawer index and wrap around if it exceeds the number of players
    drawerIndex = (drawerIndex + 1) % players.length;

    // Update the drawer index for this room
    drawerIndices[roomID] = drawerIndex;

    // Return the player object at the new drawer index
    return players[drawerIndex];
}

let roundTimer = {};
let bonusScore = {};
let roundInterval = {};

function drawerSelectWord(roomID, word) {
    if (activeRooms.hasOwnProperty(roomID)) {
        activeRooms[roomID].currentWord = word;
        if (activeRooms[roomID].players) {
            const isDrawerId = activeRooms[roomID].players.filter(player => player.isDrawer).map(player => player.id);
            io.to(roomID).emit('drawerChoseWord', roomID, isDrawerId[0], word.length);
        }
    }
    else {
        // Emit 'noSuchRoom' event to the client
        io.to(roomID).emit('noSuchRoom');
    }
}
let preRoundInterval = {};
function preRoundFunction(roomID){
    if (activeRooms.hasOwnProperty(roomID)) {
        const word = activeRooms[roomID].currentWord;
        io.to(roomID).emit('preRound', word);
        preRoundInterval[roomID] = setTimeout(() => startNewRound(roomID), 2000);
    }
    else {
        // Emit 'noSuchRoom' event to the client
        io.to(roomID).emit('noSuchRoom');
    }
}
// Function to start a new round in a room
function startNewRound(roomID) {
    if (activeRooms.hasOwnProperty(roomID)) {
        bonusScore[roomID] = 0;
        // Select a drawer for the next round
        const room = activeRooms[roomID];
        const currentRound = room.currentRound || 0; // Get the current round count or default to 0
        const numberOfRounds = room.numberOfRounds;
        if (currentRound < numberOfRounds) {
            // Select a drawer for the next round
            const drawer = selectDrawer(roomID);
            if (drawer) {
                const drawerIndex = activeRooms[roomID].players.findIndex(player => player.id === drawer.id);

                if (activeRooms[roomID].players) {
                    for (let i = 0; i < activeRooms[roomID].players.length; i++) {
                        if (i == drawerIndex) {
                            activeRooms[roomID].players[i].isDrawer = true;
                        }
                        else {
                            activeRooms[roomID].players[i].isDrawer = false;
                        }
                        activeRooms[roomID].players[i].isCorrect = false;
                    }
                }
                const roundTime = room.roundTime;
                bonusScore[roomID] = parseInt(roundTime);
                io.to(roomID).emit('newRound', drawer.id, drawer.name);
                room.currentDrawer = drawer.id;
                activeRooms[roomID].currentDrawer = drawer.id;
                activeRooms[roomID].currentWord = '***';
                room.currentRound = currentRound + 1; // Increment the current round count
                // Start next round after timeout
                function updateTimer(){
                    bonusScore[roomID]--;
                    if (bonusScore[roomID] < 0) {
                        clearInterval(roundInterval[roomID]); // Stop the timer when it reaches 120 seconds
                    }
                    io.to(roomID).emit('roundTime', bonusScore[roomID]);
                }
                roundInterval[roomID] = setInterval(updateTimer, 1000);
                roundTimer[roomID] = setTimeout(() => {
                    preRoundFunction(roomID);
                    // startNewRound(roomID);
                    clearInterval(roundInterval[roomID]);
                }, roundTime * 1000); // Replace ROUND_TIMEOUT with the desired timeout value
            }
        } else {
            // If all rounds have been completed, end the game
            activeRooms[roomID].gameStarted = false;
            clearInterval(roundInterval[roomID]);
            io.to(roomID).emit('endGame', roomID, activeRooms[roomID].players);
        }
    }
    else {
        // Emit 'noSuchRoom' event to the client
        io.to(roomID).emit('noSuchRoom');
    }
}
const maxPlayers = 8;
const minPlayers = 2;
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (roomID, playerName, playerImage, isHost) => {
        // Check if the room exists
        if (activeRooms.hasOwnProperty(roomID)) {
            // Join the specified room
            if (activeRooms[roomID].players.length < maxPlayers) {
                socket.join(roomID);
                activeRooms[roomID] = activeRooms[roomID] || { players: [], currentDrawer: null };
                // Store player information
                activeRooms[roomID].players.push({ id: socket.id, name: playerName, imageurl: playerImage, isHost: isHost, guessCount: 0, gameScore: 0, isDrawer: false, isCorrect: false });
                if (activeRooms[roomID].players.length === 1) {
                    startCountdownTimer(roomID);
                }
                // Notify all players in the room about the new player
                io.to(roomID).emit('playerJoined', { roomID: roomID, roundTime: activeRooms[roomID].roundTime, numberOfRounds: activeRooms[roomID].numberOfRounds, players: activeRooms[roomID].players });

                // if room has atleast 2 players give signal that player can start the game
                if (activeRooms[roomID].players.length >= minPlayers) {
                    io.to(roomID).emit('youCanStart', activeRooms[roomID].players[0].id);
                }
            }
            else {
                socket.emit('roomFull');
            }
        } else {
            // Emit 'noSuchRoom' event to the client
            socket.emit('noSuchRoom');
        }
    });
    socket.on('startGame', (roomID) => {
        activeRooms[roomID].gameStarted = true;
        startNewRound(roomID);
        clearInterval(countdownInterval);
    })
    socket.on('currentWord', (roomID, currentWord) => {
        drawerSelectWord(roomID, currentWord);
    })
    socket.on('clear', (roomID) => {
        // Broadcast clear event to all clients in the room except the drawer
        socket.to(roomID).emit('clear');
    });
    socket.on('joinRandomRoom', () => {
        const roomId = joinRandomRoom(socket.id);
        socket.join(roomId);
        socket.emit('joinedRoom', roomId);
    });

    socket.on('drawing', ({ startX, startY, endX, endY, color, lineWidth, isErasing, roomID }) => {
        if (activeRooms[roomID]) {
            if (activeRooms[roomID].currentDrawer === socket.id) {
                // If the sender is the current drawer, broadcast the drawing event.
                socket.to(roomID).emit('drawing', { startX, startY, endX, endY, color, lineWidth, isErasing });
            }
        }
    });


    // Handle guess submission
    socket.on('checkGuess', (id, roomID, playerName, playerImage, guess) => {
        if (activeRooms.hasOwnProperty(roomID)) {
            const correctWord = activeRooms[roomID].currentWord;
            console.log(correctWord, guess);
            const isCorrect = guess.toLowerCase() === correctWord.toLowerCase();
            const sentGuess = isCorrect ? 'correct' : guess;
            io.to(roomID).emit('guessResult', playerName, playerImage, sentGuess, bonusScore[roomID]);
            if (isCorrect) {
                if (activeRooms[roomID].players) {
                    for (let i = 0; i < activeRooms[roomID].players.length; i++) {
                        if (activeRooms[roomID].players[i].id === id) {
                            activeRooms[roomID].players[i].isCorrect = true;
                            activeRooms[roomID].players[i].guessCount++;
                            activeRooms[roomID].players[i].gameScore += parseInt(bonusScore[roomID])
                            // break; // Exit the loop once the match is found
                        }
                        if (activeRooms[roomID].players[i].id === activeRooms[roomID].currentDrawer) {
                            activeRooms[roomID].players[i].gameScore += 10
                        }
                    }
                }
                // clearTimeout(roundTimer[roomID]);
                clearInterval(roundInterval[roomID]);
                // startNewRound(roomID);
            }
            const allCorrectExceptDrawer = activeRooms[roomID].players.every(player => player.isDrawer || player.isCorrect);
            if (allCorrectExceptDrawer) {
                clearTimeout(roundTimer[roomID]);
                clearInterval(roundInterval[roomID]);
                // startNewRound(roomID);
                preRoundFunction(roomID);
            }

        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');

        // Find the room the player was in and remove them
        for (const roomID in activeRooms) {
            const room = activeRooms[roomID];
            const index = activeRooms[roomID].players.findIndex(player => player.id === socket.id);
            if (index !== -1) {
                activeRooms[roomID].players.splice(index, 1);
                io.to(roomID).emit('playerLeft', activeRooms[roomID].players);
                // If the game has started and there are fewer than 2 players remaining, end the game
                if (room.players.length < minPlayers) {
                    io.to(roomID).emit('dontStart');
                }
                if (room.gameStarted && room.players.length < minPlayers) {
                    activeRooms[roomID].gameStarted = false;
                    clearInterval(roundInterval[roomID]);
                    io.to(roomID).emit('endGame', roomID, room.players);
                }
                break;
            }
        }
    });
});

// Function to start the countdown timer for a room
function startCountdownTimer(roomID) {
    const countdownDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    countdownTimes[roomID] = countdownDuration;

    countdownInterval = setInterval(() => {
        countdownTimes[roomID] -= 1000; // Decrement countdown time by 1 second
        if (countdownTimes[roomID] <= 0) {
            // If countdown reaches zero, clear the room and stop the interval
            clearInterval(countdownInterval);
            clearRoom(roomID);
        }
        // Emit countdown time to all players in the room
        io.to(roomID).emit('countdownTime', countdownTimes[roomID]);
    }, 1000);
}
// Function to clear the room when the countdown timer expires
function clearRoom(roomID) {
    // Implement the logic to clear the room (remove players, reset variables, etc.)
    io.to(roomID).emit('roomExpired', roomID);
    delete activeRooms[roomID];
}
server.listen(port, () => {
    console.log('Server started on port 3000');
});
// Start the server
// app.listen(port, () => {
//     console.log(`Server is running at http://localhost:${port}`);
// });

