const socket = io();

let roomID;
let playerName;

function joinRoom() {
    roomID = document.getElementById('roomID').value;
    playerName = document.getElementById('playerName').value;

    socket.emit('joinRoom', roomID, playerName);
    // Listen for the 'startRound' event from the server
    
    document.getElementById('roomForm').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';

    const canvas = document.getElementById('wordCanvas');
    const ctx = canvas.getContext('2d');
    
    // Event listeners for drawing actions
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    // let currentDrawerId;

    // Receive the word from the server and display it in the canvas
    socket.on('newRound', ({ word, drawerId, roundTime}) => {
        
        // Clear the canvas
        const guess_word_element = document.getElementById('guess_word');
        guess_word_element.innerHTML = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket.id === drawerId) {
            guess_word_element.innerHTML = 'Draw :'+word;
            // to draw on mouse events
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);

            // to draw on touch events
            canvas.addEventListener('touchstart', handleTouchStart, false);
            canvas.addEventListener('touchmove', handleTouchMove, false);
            canvas.addEventListener('touchend', handleTouchEnd, false);
        }
        else {
            // Disable drawing for non-current drawers
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
    
            canvas.removeEventListener('touchstart', handleTouchStart, false);
            canvas.removeEventListener('touchmove', handleTouchMove, false);
            canvas.removeEventListener('touchend', handleTouchEnd, false);
        }
        startTimer(roundTime); // Start timer with 30 seconds
    });

     // Function to start the timer
     function startTimer(seconds) {
        let timer = seconds;
        const timerElement = document.getElementById('timer');

        // Update the timer every second
        const countdown = setInterval(() => {
            timer--;
            timerElement.textContent = timer;

            // If the timer reaches 0, clear the interval
            if (timer <= 0) {
                clearInterval(countdown);
                // Perform any actions when the timer expires (e.g., end of round)
            }
        }, 1000);
    }
    // BEGIN: functions to handle drawing using touch on mobile phones or touch screen devices 
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        lastX = touch.pageX - canvas.offsetLeft;
        lastY = touch.pageY - canvas.offsetTop;
        startDrawing();
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const startX = lastX;
        const startY = lastY;
        const endX = touch.pageX - canvas.offsetLeft;
        const endY = touch.pageY - canvas.offsetTop;
        drawLine(startX, startY, endX, endY);
        socket.emit('drawing', { startX, startY, endX, endY, roomID });
        [lastX, lastY] = [endX, endY];
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        stopDrawing();
    }
    // END: functions to handle drawing using touch on mobile phones or touch screen devices 

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
        socket.emit('drawing', { startX, startY, endX, endY, roomID });
        [lastX, lastY] = [endX, endY];
    }

    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY) {
        const canvas = document.getElementById('wordCanvas');
        const ctx = canvas.getContext('2d');
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
    socket.emit('guess', roomID, playerName, guess);
}
