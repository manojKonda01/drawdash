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
function clearCanvas() {
    const canvas = document.getElementById('canva_board');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const canvas = document.getElementById('canva_board');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawingData = [];
                return response.json()
            })
            .then(json => {
                alert(json.message);
                generateRandomWords();
            })
        drawingData = [];

    }
    $('#add_drawing_btn').click(function () {
        const word = $('.random-word-btn.selected').attr('id');
        saveDrawingDataforAdmin(word, JSON.stringify(drawingData));
    })
    $('#clear').click(function () {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingData = [];
    });

}
function generateRandomWords() {
    fetch('/random_words', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            $('#word_body').html('');
            data.forEach(word => {
                const $button = $('<button>', {
                    text: capitalizeFirstLetter(word),
                    class: 'btn random-word-btn',
                    id: word
                });
                $('#word_body').append($button);
            });
            $('#random_word_modal').modal({ backdrop: 'static', keyboard: false })
            $('#random_word_modal').modal('show');
        })
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function soloPlay() {
    const canvas = document.getElementById('canva_board');
    const ctx = canvas.getContext('2d');
    let drawingArray = [];
    let currentRound = 0; // Current round index
    let currentDrawingData = []; // Current drawing data to be displayed
    let totalTime = 120000; // Total time in milliseconds
    let elapsedTime = 0; // Elapsed time
    let roundTime = 15000; // Time for each round in milliseconds (15 seconds)
    let roundTimer; // Timer for each round
    let countDownTimer;
    let drawTimer; //Timer to draw
    drawN(20);

    function displayWord(word) {
        const wordContainer = document.getElementById('wordContainer');
        wordContainer.innerHTML = ''; // Clear previous content

        // Iterate over each letter in the word
        for (let i = 0; i < word.length; i++) {
            // Create a span element for the letter
            const letterSpan = document.createElement('span');
            //   letterSpan.textContent = word[i];
            letterSpan.classList.add('letter'); // Add the letter class

            // Append the letter span to the word container
            wordContainer.appendChild(letterSpan);
        }
    }
    // function to draw one data
    function drawOne() {
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
    }
    // function to draw n rounds
    function drawN(count) {
        fetch('/getnDrawingData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count: count }),
        })
            .then(response => response.json())
            .then(json => {
                if (json.data) {
                    $('.loader-wrapper').addClass('d-none');
                    drawingArray = json.data;
                    startDrawingProcess();
                }
                else {
                    'no drawing data from the server';
                }
            })
    }
    const countDown = $('#round_timer');
    // Function to start the timer for each round
    function startRoundTimer() {
        // Start the timer for the current round
        // countDownTimer = setInterval(() => { }, 1000)
        roundTimer = setInterval(() => {
            elapsedTime += roundTime;
            console.log('round time: ', elapsedTime, 'total Time : ', totalTime);
            if (elapsedTime > totalTime) {
                // Stop the drawing process if the total time is exceeded
                clearInterval(roundTimer);
                // clearInterval(countDownTimer);
                console.log('Total time exceeded!');
            } else {
                advanceToNextRound();
            }
        }, roundTime);
    }

    // Function to advance to the next round
    function advanceToNextRound() {
        // Increment the round index
        currentRound++;
        console.log('round', currentRound + 1);
        // Check if all rounds have been completed
        if (currentRound < drawingArray.length) {
            // Set the current drawing data for the next round
            let jsonString = JSON.stringify(JSON.parse(drawingArray[currentRound].data))
            $('#hidden_word').val(drawingArray[currentRound].word);
            displayWord(drawingArray[currentRound].word);
            if (jsonString) {
                currentDrawingData = JSON.parse(jsonString);
                // Draw the current drawing data
                clearCanvas();
                drawLinesStepByStep(currentDrawingData);
            }
            else {
                console.log('null json');
            }
        } else {
            // All rounds have been completed
            clearInterval(roundTimer);
            // clearInterval(countDownTimer);
            if (currentRound == drawingArray.length) {
                $('#scoreboard').modal({ backdrop: 'static', keyboard: false })
                $('#scoreboard').modal('show');
            }
            console.log('All rounds completed!');
            // open Leader Board
        }
    }

    document.getElementById('guess_submit').addEventListener('submit', function (event) {
        checkGuess(event)
    })
    $('#submit_guess_icon').click(function (event) {
        checkGuess(event);
    })
    function checkGuess() {
        event.preventDefault();
        const inputValue = $('#type_guess').val()
        handlePlayerGuess(inputValue);
        $('#type_guess').val('');
    }
    // Function to handle player's guess
    function handlePlayerGuess(guess) {
        // Check if the guess is correct
        const correctGuess = $('#hidden_word').val() == guess;
        if (correctGuess) {
            clearTimeout(drawTimer);
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
            ctx.closePath();

            // Guess is correct, advance to the next round immediately
            $('#start_guessing').text('Your Guess is Right!');
            clearInterval(roundTimer); // Stop the timer for the current round
            // clearInterval(countDownTimer);
            advanceToNextRound();
            startRoundTimer();
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        } else {
            // Guess is incorrect, continue with the timer for the current round
            console.log('Incorrect guess. Waiting for round timer to expire.');
        }
    }

    // funtion to start drawing process
    function startDrawingProcess() {
        startTimer();
        let jsonString = JSON.stringify(JSON.parse(drawingArray[currentRound].data))
        $('#hidden_word').val(drawingArray[currentRound].word);
        displayWord(drawingArray[currentRound].word);
        if (jsonString) {
            currentDrawingData = JSON.parse(jsonString);
            drawLinesStepByStep(currentDrawingData);
            // Start the timer for the first round
            startRoundTimer();
        }
        else {
            console.log('null json')
        }
        // Start the overall timer to ensure the total duration does not exceed 120 seconds
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
            $('#scoreboard').modal({ backdrop: 'static', keyboard: false })
            $('#scoreboard').modal('show');
            console.log('Drawing process completed!');
            // You can add any additional logic here when the total duration is reached
        }, totalTime);
    }
    // Function to draw lines step by step
    function drawLinesStepByStep(drawingData) {
        $('#start_guessing').text('');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let index = 0;
        function drawNextLine() {
            if (index < drawingData.length) {
                const line = drawingData[index];
                const { startX, startY, endX, endY } = line;
                const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const isSmallScreen = viewportWidth <= 767; // Check if the viewport width is less than 767 pixels
                const offsetX = isSmallScreen ? 50 : 0; // Adjust this value as needed for small screens
                const scale = isSmallScreen ? 0.75 : 1;
                drawLine(startX * scale - offsetX, startY * scale, endX * scale - offsetX, endY * scale);
                index++;
                drawTimer = setTimeout(drawNextLine, 5); // Adjust the delay between lines (100 milliseconds in this example)
            }
        }

        drawNextLine();
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
    // function startTimer(duration) {
    //     let timer = duration;
    //     const timerDisplay = document.getElementById('timer');
    //     // Update the timer every second
    //     const countdownInterval = setInterval(function () {
    //         timerDisplay.textContent = timer - 1;
    //         timerDisplay.classList.add('countdown');
    //         // Check if the timer has reached 0
    //         if (--timer < 0) {
    //             clearInterval(countdownInterval);
    //             // timerDisplay.textContent = 'Timer expired';
    //             // Add any additional logic to execute when the timer expires
    //         }
    //     }, 1000);
    // }
    function startTimer() {
        let seconds = 120; // Initial value for seconds
        const timerDisplay = document.getElementById('timer');
        timerDisplay.classList.add('countdown');
        // Function to update the timer display
        function updateTimer() {
            document.getElementById('timer').textContent = seconds; // Update the timer display
            seconds--; // Increment seconds
            if (seconds < 0) {
                clearInterval(timerInterval); // Stop the timer when it reaches 120 seconds
            }
        }

        // Update the timer display immediately when the function is called
        updateTimer();

        // Call updateTimer every second to increment the timer
        const timerInterval = setInterval(updateTimer, 1000);
    }
    function stopDraw() {
        ctx.closePath();
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
