const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Import the path module
const fs = require('fs');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.use(express.static(path.join(__dirname, 'public')));

// Store game rooms
const rooms = {};
const maxRoomSize = 8;
const ROUND_TIMEOUT = 30000;

// Function to find or create a room and join it
function joinRandomRoom(playerId) {
    let roomToJoin;

    // Find a room with available space or create a new one
    for (const roomId in rooms) {
        if (rooms[roomId].length < maxRoomSize) {
            roomToJoin = roomId;
            break;
        }
    }

    if (!roomToJoin) {
        roomToJoin = createRoom();
    }

    // Add the player to the room
    rooms[roomToJoin].push(playerId);

    return roomToJoin;
}

// Function to create a new room
function createRoom() {
    const roomId = generateRoomId();
    rooms[roomId] = [];
    return roomId;
}

// Function to generate a random room ID
function generateRoomId() {
    // Generate a v4 (random) UUID
    return uuid.v4();
}


function getRandomWordFromFile(filePath, roomID) {
    try {
        // Read the contents of the file
        const words = fs.readFileSync(filePath, 'utf8').split('\n').filter(word => word.trim() !== '');

        // Generate a random index to select a word from the array
        const randomIndex = Math.floor(Math.random() * words.length);
        
        // Store the word in the room object
        rooms[roomID].currentWord = words[randomIndex].toLowerCase();
        // Return the randomly selected word in lowercase
        return words[randomIndex].toLowerCase();
    } catch (error) {
        console.error('Error reading file or generating random word:', error);
        return null;
    }
}

const drawerIndices = {};

// Function to select a drawer for the next round
function selectDrawer(roomID) {
    const room = rooms[roomID];
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

// Function to start a new round in a room
function startNewRound(roomID) {
    // Select a drawer for the next round
    const drawer = selectDrawer(roomID);
    // Generate a random word and store it in the room object
    const word =  getRandomWordFromFile('word.txt', roomID);

    // Notify players about the new round and word
    io.to(roomID).emit('newRound', { word, drawerId: drawer.id, roundTime: ROUND_TIMEOUT/1000});
    rooms[roomID].currentDrawer = drawer.id;
    // Start next round after timeout
    setTimeout(() => {
        startNewRound(roomID);
    }, ROUND_TIMEOUT); // Replace ROUND_TIMEOUT with the desired timeout value
}

let currentDrawerId; // Variable to store the ID of the current drawer
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (roomID, playerName) => {
        // Join the specified room
        socket.join(roomID);
        rooms[roomID] = rooms[roomID] || { players: [], currentDrawer: null };
        if (rooms[roomID].players.length === 1) {
            startNewRound(roomID);
        }
        // Store player information
        rooms[roomID].players.push({ id: socket.id, name: playerName });
        // Notify all players in the room about the new player
        io.to(roomID).emit('playerJoined', rooms[roomID].players);
    });

    socket.on('joinRandomRoom', () => {
        const roomId = joinRandomRoom(socket.id);
        socket.join(roomId);
        socket.emit('joinedRoom', roomId);
    });

    socket.on('drawing', ({ startX, startY, endX, endY, roomID }) => {
        if (rooms[roomID].currentDrawer === socket.id) {
          // If the sender is the current drawer, broadcast the drawing event.
          socket.to(roomID).emit('drawing', { startX, startY, endX, endY });
        }
      });

    // Store guessed words for each player in each room
    const guessedWords = {};

    // Handle guess submission
    socket.on('guess', (roomID, playerName, guess) => {
        const correctWord = rooms[roomID].currentWord;
        const isCorrect = guess.toLowerCase() === correctWord.toLowerCase();
        guessedWords[roomID] = guessedWords[roomID] || {};
        guessedWords[roomID][playerName] = guess;
        
        io.to(roomID).emit('guessResult', { playerName, guess, isCorrect });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');

        // Find the room the player was in and remove them
        for (const roomID in rooms) {
            const players = rooms[roomID].players;
            const index = players.findIndex(player => player.id === socket.id);
            if (index !== -1) {
                players.splice(index, 1);
                io.to(roomID).emit('playerLeft', players);
                break;
            }
        }
    });

});

server.listen(3000, () => {
    console.log('Server started on port 3000');
});
