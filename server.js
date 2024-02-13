const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Import the path module

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.use(express.static(path.join(__dirname, 'public')));

// Store game rooms
const rooms = {};
const ROUND_TIMEOUT = 30000;

// Function to generate a random word and store it in the room object
function generateRandomWord(roomName) {
    // Your word generation logic here
    const words = ['apple', 'banana', 'orange', 'grape', 'pineapple'];
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];

    // Store the word in the room object
    rooms[roomName].currentWord = word;

    return word;
}

const drawerIndices = {};

// Function to select a drawer for the next round
function selectDrawer(roomName) {
    const room = rooms[roomName];
    const players = room.players;

    // Get the current drawer index for this room, or initialize it to 0 if it's undefined
    let drawerIndex = drawerIndices[roomName] || 0;

    // Increment the drawer index and wrap around if it exceeds the number of players
    drawerIndex = (drawerIndex + 1) % players.length;

    // Update the drawer index for this room
    drawerIndices[roomName] = drawerIndex;

    // Return the player object at the new drawer index
    return players[drawerIndex];
}

// Function to start a new round in a room
function startNewRound(roomName) {
    // Select a drawer for the next round
    const drawer = selectDrawer(roomName);
    // Generate a random word and store it in the room object
    const word = generateRandomWord(roomName);

    // Notify players about the new round and word
    io.to(roomName).emit('newRound', { word, drawerId: drawer.id});
    // Start next round after timeout
    setTimeout(() => {
        startNewRound(roomName);
    }, ROUND_TIMEOUT); // Replace ROUND_TIMEOUT with the desired timeout value
}


io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (roomName, playerName) => {
        // Join the specified room
        socket.join(roomName);
        rooms[roomName] = rooms[roomName] || { players: [] };
        if (rooms[roomName].players.length === 1) {
            startNewRound(roomName);
        }
        // Store player information
        rooms[roomName].players.push({ id: socket.id, name: playerName });

        // Notify all players in the room about the new player
        io.to(roomName).emit('playerJoined', rooms[roomName].players);
    });

    // Initialize a variable to store the drawer's socket ID for each room
    socket.on('drawing', ({ startX, startY, endX, endY, roomName }) => {
        // const drawerSocketId = drawerByRoom[roomName];
        // if (socket.id === drawerSocketId) {
            socket.to(roomName).emit('drawing', { startX, startY, endX, endY });
        // }
    });

    // Store guessed words for each player in each room
    const guessedWords = {};

    // Handle guess submission
    socket.on('guess', (roomName, playerName, guess) => {
        const correctWord = rooms[roomName].currentWord;
        const isCorrect = guess.toLowerCase() === correctWord.toLowerCase();
        guessedWords[roomName] = guessedWords[roomName] || {};
        guessedWords[roomName][playerName] = guess;
        
        io.to(roomName).emit('guessResult', { playerName, guess, isCorrect });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');

        // Find the room the player was in and remove them
        for (const roomName in rooms) {
            const players = rooms[roomName].players;
            const index = players.findIndex(player => player.id === socket.id);
            if (index !== -1) {
                players.splice(index, 1);
                io.to(roomName).emit('playerLeft', players);
                break;
            }
        }
    });

});

server.listen(3000, () => {
    console.log('Server started on port 3000');
});

