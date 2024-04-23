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


const {connectToMongoDB, insertDrawingData, getRandomDrawingData, getCountRandomDrawingData, registerUser, googleSignIn} = require('./DB')


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
    try{
        const {username, name, imageurl} = req.body;
        let new_image = imageurl;
        if(!imageurl){
            new_image = 'media/images/avatars/panda.svg';
        }
        const result = await registerUser(username, name, imageurl);
        if(result.success){
            res.status(200).json(result);
        }
        else{
            res.status(500).json(result);
        }
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
})
// api to register user
app.post('/googlesignin', async (req, res) => {
    try{
        const {username, name, imageurl} = req.body;
        const result = await googleSignIn(username, name, imageurl);
        if(result.success){
            res.status(200).json(result);
        }
        else{
            res.status(500).json(result);
        }
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
})
// api to get random word
app.get('/random_words', (req, res) => {
    res.json(getRandomWords('word.txt', 3));
})
// api to add drawing data
app.post('/add_drawing_data', async (req, res) => {
    try{
        const {word, data} = req.body;
        const result = await insertDrawingData({word, data});
        if(result.success){
            res.status(200).json({message: 'Drawing Data Inserted'});
        }
        else{
            res.status(500).json({message: 'Drawing Data Insertion failed'});
        }
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// api to get random drawing data
app.post('/getDrawingData', async (req, res) => {
    try{
        const result = await getRandomDrawingData();
        if(result.success){
            res.status(200).json({message: 'Success', data: result.data});
        }
        else{
            res.status(500).json({message: 'Failed To Get Data'});
        }
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
})

// api to get n random drawing data
app.post('/getnDrawingData', async (req, res) => {
    try{
        const {count} = req.body
        const result = await getCountRandomDrawingData(count);
        if(result.success){
            res.status(200).json({message: 'Success', data: result.data});
        }
        else{
            res.status(500).json({message: 'Failed To Get Data'});
        }
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
})

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

server.listen(port, () => {
    console.log('Server started on port 3000');
});
// Start the server
// app.listen(port, () => {
//     console.log(`Server is running at http://localhost:${port}`);
// });

