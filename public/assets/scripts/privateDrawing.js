const socket = io();

let roomID;
let playerName;



const canvas = document.getElementById('canva_board');
const ctx = canvas.getContext('2d');
// Function to set canvas size based on CSS size
function setCanvasSize() {
    const computedStyle = getComputedStyle(canvas);
    const cssWidth = parseInt(computedStyle.width);
    const cssHeight = parseInt(computedStyle.height);
    canvas.width = cssWidth;
    canvas.height = cssHeight;
}
window.addEventListener('load', setCanvasSize);

function drawing() {
    const canvas = document.getElementById('canva_board');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    let history = [''];
    let drawingData = []; // Array to store drawing data
    let historyIndex = -1;
    // to draw on mouse events
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // to draw on touch events
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);

    // BEGIN: functions to handle drawing using touch on mobile phones or touch screen devices 
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        lastX = touch.clientX - canvas.getBoundingClientRect().left;
        lastY = touch.clientY - canvas.getBoundingClientRect().top;
        startDrawing(e);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const startX = lastX;
        const startY = lastY;
        const endX = touch.clientX - canvas.getBoundingClientRect().left;
        const endY = touch.clientY - canvas.getBoundingClientRect().top;
        const line = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: 'black', // Add color property as needed
            lineWidth: 2, // Add line width property as needed
        };
        drawingData.push(line);
        drawLine(startX, startY, endX, endY);
        [lastX, lastY] = [endX, endY];
    }

    // END: functions to handle drawing using touch on mobile phones or touch screen devices 
    function handleTouchEnd(e) {
        e.preventDefault();
        stopDrawing(e);
    }
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

        const line = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: 'black', // Add color property as needed
            lineWidth: 2, // Add line width property as needed
        };
        drawingData.push(line);

        drawLine(startX, startY, endX, endY);
        [lastX, lastY] = [endX, endY];
    }
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY) {
        const canvas = document.getElementById('canva_board');
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
    function stopDrawing(event) {
        if (isDrawing) {
            ctx.closePath();
            if (!event.type.includes('mouseout') || !event.type.includes('touchend')) {
                saveDrawing();
            }
            isDrawing = false;
        }
    }

    function saveDrawing() {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(canvas.toDataURL());
        historyIndex++;
    }
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex];
        }
        else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    $('#undo').click(function () {
        undo();
    })
    function redo() {
        console.log('redo', history, historyIndex);
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex];
        }
    }
    $('#redo').click(function () {
        redo();
    })

    function saveDrawingDataforAdmin(word, drawingData) {
        fetch('/add_drawing_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: word, data: drawingData }),
        })
            .then(response => response.json())
            .then(json => {
                console.log(json);
            })
    }
    $('#add_drawing_btn').click(function () {
        const word = $('.random-word-btn.selected').attr('id');
        saveDrawingDataforAdmin(word, JSON.stringify(drawingData));
    })

}

function soloPlay() {
    fetch('/getDrawingData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ excludedKeys: [] }),
    })
        .then(response => response.json())
        .then(json => {
            if (json.data.data) {
                const jsonString = JSON.stringify(JSON.parse(json.data.data))
                if (jsonString) {
                    try {
                        const drawingData = JSON.parse(jsonString);
                        // Start drawing step by step
                        drawLinesStepByStep(drawingData);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                    }
                }
            }
            else {
                console.log('Null Data');
            }
        })
    // Function to draw lines step by step
    function drawLinesStepByStep(drawingData) {
        let index = 0;
        function drawNextLine() {
            if (index < drawingData.length) {
                const line = drawingData[index];
                const { startX, startY, endX, endY } = line;
                // Get the width of the viewport
                const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

                // Adjust the startY, endY, and endX values accordingly
                const scaleFactor = viewportWidth / canvas.width;
                // const startX = line.startX * scaleFactor - 100;
                // const startY = line.startY * scaleFactor -100;
                // const endX = line.endX * scaleFactor -100;
                // const endY = line.endY * scaleFactor -100;
                drawLine(startX, startY, endX, endY);
                index++;
                setTimeout(drawNextLine, 10); // Adjust the delay between lines (100 milliseconds in this example)
            }
        }

        drawNextLine();
    }
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY) {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
}
function joinRoom() {
    roomID = document.getElementById('roomID').value;
    playerName = document.getElementById('playerName').value;

    socket.emit('joinRoom', roomID, playerName);
    // Listen for the 'startRound' event from the server

    document.getElementById('roomForm').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';

    // Event listeners for drawing actions
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    // let currentDrawerId;

    // Receive the word from the server and display it in the canvas
    socket.on('newRound', ({ word, drawerId, roundTime }) => {

        // Clear the canvas
        const guess_word_element = document.getElementById('guess_word');
        guess_word_element.innerHTML = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket.id === drawerId) {
            guess_word_element.innerHTML = 'Draw :' + word;
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

    // END: functions to handle drawing using touch on mobile phones or touch screen devices 
    function handleTouchEnd(e) {
        e.preventDefault();
        stopDrawing();
    }
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
        [lastX, lastY] = [endX, endY];
    }
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY) {
        const canvas = document.getElementById('canva_board');
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
    function stopDrawing(event) {
        if (isDrawing) {
            if (!event.type.includes('mouseout')) {
                saveDrawing();
            }
            isDrawing = false;
        }
    }

    function saveDrawing() {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(canvas.toDataURL());
        historyIndex++;
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex];
        }
    }
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[historyIndex];
        }
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

function submitGuess() {
    const guess = document.getElementById('guessInput').value;
    playerName = document.getElementById('playerName').value;
    socket.emit('guess', roomID, playerName, guess);
}
