const socket = io();

let roomName;
let playerName;

function joinRoom() {
    roomName = document.getElementById('roomName').value;
    playerName = document.getElementById('playerName').value;

    socket.emit('joinRoom', roomName, playerName);
    // Listen for the 'startRound' event from the server
    
    document.getElementById('roomForm').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';

    const canvas = document.getElementById('wordCanvas');
    const ctx = canvas.getContext('2d');
    
    // Event listeners for drawing actions
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    // Receive the word from the server and display it in the canvas
    socket.on('newRound', ({ word, drawerId}) => {
        
        // Clear the canvas
        const guess_word_element = document.getElementById('guess_word');
        guess_word_element.innerHTML = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDrawer = socket.id === drawerId;
        if (isDrawer) {
            guess_word_element.innerHTML = word;
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
        }
    });

    // Function to start drawing
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    // Function to draw
    function draw(e) {
        if (!isDrawing) return; // stop the function if the player should not draw
        const startX = lastX;
        const startY = lastY;
        const endX = e.offsetX;
        const endY = e.offsetY;
        drawLine(startX, startY, endX, endY);
        socket.emit('drawing', { startX, startY, endX, endY, roomName });
        [lastX, lastY] = [endX, endY];
    }

    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY) {
        // const canvas = document.getElementById('wordCanvas');
        // const ctx = canvas.getContext('2d');
        // Start a new path
        ctx.beginPath();
        
        // Set the line style
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        // Move to the starting point
        ctx.moveTo(startX, startY);

        // Draw a line to the ending point
        ctx.lineTo(endX, endY);

        // Stroke the line
        ctx.stroke();
    }

    // Function to stop drawing
    function stopDrawing() {
        isDrawing = false;
    }

    // Listen for 'drawing' event from other players
    socket.on('drawing', ({ startX, startY, endX, endY }) => {
        drawLine(startX, startY, endX, endY);
    });

    // Receive and display guess results from server
    socket.on('guessResult', ({ playerName, guess, isCorrect }) => {
        if (isCorrect) {
            // If the guess is correct, display a message to all players
            alert(`${playerName}'s guess "${guess}" is correct!`);
        } else {
            // If the guess is incorrect, display the guess to all players
            const guessDisplay = document.getElementById('guessDisplay');
            const newGuessElement = document.createElement('div');
            newGuessElement.textContent = `${playerName}: ${guess}`;
            guessDisplay.appendChild(newGuessElement);
        }
    });
}

function submitGuess() {
    const guess = document.getElementById('guessInput').value;
    playerName = document.getElementById('playerName').value;
    socket.emit('guess', roomName, playerName, guess);
}
