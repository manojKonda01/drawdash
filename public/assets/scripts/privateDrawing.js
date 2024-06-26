let roomID;
let playerName;
let reload = false;

const canvas = document.getElementById('canva_board');
const ctx = canvas.getContext('2d');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0,0,256,256" style="fill:#000000;"> <g fill="none" fill-rule="nonzero" stroke="none" stroke-width="none" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(6.4,6.4)"><path d="M20,38.5c-10.2,0 -18.5,-8.3 -18.5,-18.5c0,-10.2 8.3,-18.5 18.5,-18.5c10.2,0 18.5,8.3 18.5,18.5c0,10.2 -8.3,18.5 -18.5,18.5z" fill="#326400" stroke="none" stroke-width="1"></path><path d="M20,2c9.9,0 18,8.1 18,18c0,9.9 -8.1,18 -18,18c-9.9,0 -18,-8.1 -18,-18c0,-9.9 8.1,-18 18,-18M20,1c-10.5,0 -19,8.5 -19,19c0,10.5 8.5,19 19,19c10.5,0 19,-8.5 19,-19c0,-10.5 -8.5,-19 -19,-19z" fill="#326400" stroke="none" stroke-width="1"></path><path d="M11.2,20.1l5.8,5.8l13.2,-13.2" fill="none" stroke="#ffffff" stroke-width="3"></path></g></g></svg>`
// Function to set canvas size based on CSS size
function setCanvasSize() {
    const computedStyle = getComputedStyle(canvas);
    const cssWidth = parseInt(computedStyle.width);
    const cssHeight = parseInt(computedStyle.height);
    canvas.width = cssWidth;
    canvas.height = cssHeight;
}
window.addEventListener('load', setCanvasSize);
function drawing(saveDrawingData) {
    const canvas = document.getElementById('canva_board');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let isErasing = false;

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
        const color = $('#colorValue').val();
        const lineWidth = document.getElementById('brushSize').value;
        const line = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: isErasing ? '#FFFFFF' : color, // Add color property as needed
            lineWidth: lineWidth ? lineWidth : 2, // Add line width property as needed
        };
        if (saveDrawingData) {
            drawingData.push(line);
        }
        drawLine(startX, startY, endX, endY, lineWidth);
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
        const color = $('#colorValue').val();
        const lineWidth = document.getElementById('brushSize').value;
        const line = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: isErasing ? '#FFFFFF' : color, // Add color property as needed
            lineWidth: lineWidth ? lineWidth : 2, // Add line width property as needed
        };
        if (saveDrawingData) {
            drawingData.push(line);
        }
        drawLine(startX, startY, endX, endY, lineWidth);
        [lastX, lastY] = [endX, endY];
    }

    $('#eraser').click(function () {
        isErasing = true;
        $('#eraser svg path').css('fill', '#3498db');
        $('#eraser').css('border', '1px solid #3498db');

        $('#paint svg path').css('fill', '#d9d9d9');
        $('#paint').css('border', '1px solid #d9d9d9');
    })
    $('#paint').click(() => {
        isErasing = false;
        $('#eraser svg path').css('fill', '#d9d9d9');
        $('#eraser').css('border', '1px solid #d9d9d9');

        $('#paint svg path').css('fill', '#3498db');
        $('#paint').css('border', '1px solid #3498db');
    })
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY, lineWidth) {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = isErasing ? '#FFFFFF' : $('#colorValue').val();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // Start a new path
        ctx.beginPath();

        // Set the line style
        ctx.lineWidth = lineWidth;

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
        $('.loader-wrapper').removeClass('d-none');
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
                $('.loader-wrapper').addClass('d-none');
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
        const word = $('.random-word-btn.selected').val();
        if (saveDrawingData) {
            saveDrawingDataforAdmin(word, JSON.stringify(drawingData));
            drawingData = [];
        }
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
                    id: word,
                    value: word
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
    const start_audio = document.getElementById('start_sound');
    const end_audio = document.getElementById('end_sound');
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
    let guess_count = 0;
    let seconds = totalTime / 1000; // Total Time
    let eachRound = roundTime / 1000;
    let roundInterval;
    let gameScore = 0;
    let rewards = 0;

    drawN(50);

    function displayWord(word) {
        const wordContainer = document.getElementById('wordContainer');
        wordContainer.innerHTML = ''; // Clear previous content
        // Iterate over each letter in the word
        for (let i = 0; i < word.trim().length; i++) {
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
    // Function to start the timer for each round
    function startRoundTimer() {
        roundInterval = setInterval(eachRoundTime, 1000);
        // Start the timer for the current round
        roundTimer = setInterval(() => {
            elapsedTime += roundTime;
            if (elapsedTime > totalTime) {
                // Stop the drawing process if the total time is exceeded
                clearInterval(roundTimer);
                clearInterval(roundInterval);
            } else {
                advanceToNextRound();
            }
        }, roundTime);
    }

    // Function to advance to the next round
    function advanceToNextRound() {
        // Increment the round index
        currentRound++;
        eachRound = roundTime / 1000;
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
                const canvas = document.getElementById('canva_board');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawLinesStepByStep(currentDrawingData);
            }
            else {
                console.log('null json');
            }
        } else {
            // All rounds have been completed
            clearInterval(roundTimer);
            clearInterval(roundInterval);
            // clearInterval(countDownTimer);
            if (currentRound == drawingArray.length) {
                if ($('#sound_off').hasClass('d-none')) {
                    end_audio.play();
                }
                $('#scoreboard').modal({ backdrop: 'static', keyboard: false });
                $('#scoreboard').modal('show');
                saveRewards(rewards)
                reload = false;
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
    const userSession = JSON.parse(localStorage.getItem('drawdash_user'));
    // Function to handle player's guess
    function handlePlayerGuess(guess) {
        const correct_audio = document.getElementById('correct_sound');
        // Check if the guess is correct
        const correctGuess = $('#hidden_word').val().toUpperCase() == guess.toUpperCase();
        var listItem = document.createElement('li');
        const chatList = document.getElementById('chat_list');

        listItem.classList.add('chat-item', 'py-1');
        var imageSrc = '';
        if (userSession.imageurl) {
            imageSrc = userSession.imageurl;
        }
        else {
            imageSrc = 'media/images/avatars/panda.svg';
        }
        const img = `<img src=${imageSrc} alt='user-image'></img>`;
        if (correctGuess) {
            if ($('#sound_off').hasClass('d-none')) {
                correct_audio.play();
            }
            guess_count++;
            gameScore = gameScore + eachRound;
            rewards = gameScore + guess_count * 10;
            $('#guess_count').text(guess_count);
            $('#final_guess_count').text(guess_count);
            $('#score').text(gameScore);
            $('#final_game_score').text(gameScore);
            $('#guess_percentage').text((guess_count / (currentRound + 1)).toFixed(2) * 100 + ' %');
            $('#rewards').text(rewards);
            clearTimeout(drawTimer);
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
            ctx.closePath();
            listItem.innerHTML = img + `<span class='guess-word-chat px-1'>Correct!<span>` + svg;
            // Guess is correct, advance to the next round immediately
            $('#start_guessing').text('Your Guess is Right!');
            clearInterval(roundTimer); // Stop the timer for the current round
            clearInterval(roundInterval);
            advanceToNextRound();
            startRoundTimer();
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        } else {
            listItem.innerHTML = img + `<span class='guess-word-chat px-1'>${guess}<span>`;
            // Guess is incorrect, continue with the timer for the current round
            console.log('Incorrect guess. Waiting for round timer to expire.');
        }
        chatList.appendChild(listItem);
        chatList.scrollTop = chatList.scrollHeight;
    }

    // funtion to start drawing process
    function startDrawingProcess() {
        if ($('#sound_off').hasClass('d-none')) {
            start_audio.play();
        }
        startTimer();
        reload = true;
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
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas;
            if ($('#sound_off').hasClass('d-none')) {
                end_audio.play();
            }
            $('#scoreboard').modal({ backdrop: 'static', keyboard: false })
            $('#scoreboard').modal('show');
            console.log('Drawing process completed!');
            saveRewards(rewards);
            reload = false;
            // You can add any additional logic here when the total duration is reached
        }, totalTime);
    }
    function saveRewards(rewards){
        const oldRewards = parseInt(JSON.parse(localStorage.getItem('drawdash_user_rewards')).rewards);
        fetch('/updateRewards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: userSession.username, newRewards: parseInt(rewards)})
        })
            .then(response => {
                if (response.ok) {
                    // Handle successful response
                    return response.json();
                } else {
                    // Handle error response
                    throw new Error('Failed to update user details');
                }
            })
            .then(data => {
                // Handle data returned by the server
                console.log(oldRewards, rewards, oldRewards + parseInt(rewards));
                localStorage.setItem('drawdash_user_rewards', JSON.stringify({ rewards: oldRewards + parseInt(rewards)}));
            })
            .catch(error => {
                // Handle fetch errors
                console.error('Error:', error);
            });
    }
    // Function to draw lines step by step
    function drawLinesStepByStep(drawingData) {
        $('#start_guessing').text('');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let index = 0;
        function drawNextLine() {
            if (index < drawingData.length) {
                const line = drawingData[index];
                const { startX, startY, endX, endY, lineWidth, color } = line;
                const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const isSmallScreen = viewportWidth <= 767; // Check if the viewport width is less than 767 pixels
                // const isSmallScreen = false;
                const offsetX = isSmallScreen ? 50 : 0; // Adjust this value as needed for small screens
                const scale = isSmallScreen ? 0.75 : 1;
                drawLine(startX * scale - offsetX, startY * scale, endX * scale - offsetX, endY * scale, lineWidth, color);
                // drawLine(startX * scale - offsetX, startY, endX * scale - offsetX, endY);
                index++;
                drawTimer = setTimeout(drawNextLine, 5); // Adjust the delay between lines (100 milliseconds in this example)
            }
        }

        drawNextLine();
    }
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY, lineWidth, color) {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // Start a new path
        ctx.beginPath();

        // Set the line style
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        // Move to the starting point
        ctx.moveTo(startX, startY);

        // Draw a line to the ending point
        ctx.lineTo(endX, endY);

        // Stroke the line
        ctx.stroke();
    }
    function eachRoundTime() {
        eachRound--;
    }
    function startTimer() {
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
function joinCreatedRoom(roomID, isHost = false) {
    const socket = io();
    playerName = userSession.username;
    playerImage = userSession.imageurl ? userSession.imageurl : 'media/images/avatars/panda.svg';
    // Event listeners for drawing actions
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    // let currentDrawerId;

    let isErasing = false;

    let history = [''];
    let drawingData = []; // Array to store drawing data
    let historyIndex = -1;

    const start_audio = document.getElementById('start_sound');
    const end_audio = document.getElementById('end_sound');
    $('.loader').addClass('d-none');
    socket.emit('joinRoom', roomID, playerName, playerImage, isHost);
    $('#room_id').text(roomID);

    // Event listener for when a player joins a room
    socket.on('playerJoined', ({ roomID, roundTime, numberOfRounds, players }) => {
        $('#room_id').val(roomID);
        $('#round_time').text(roundTime);
        $('#rounds').text(numberOfRounds);
        // Update the UI to display the list of players in the room
        updatePlayersList(players);
    });
    socket.on('countdownTime', (countdownTime) => {
        updateCountdownTimer(countdownTime);
    })
    // Handle room expiration event
    socket.on('roomExpired', function () {
        // Room has expired, display a message to the user
        alert('The room has expired.');
        $('.pvt-modal-body').addClass('d-none');
        $('#private_body').removeClass('d-none');
        // Redirect the user or handle as needed
    });

    // Listen for 'noSuchRoom' event from the server
    socket.on('noSuchRoom', () => {
        $('.pvt-modal-body').addClass('d-none');
        $('#private_body').removeClass('d-none');
        alert('No such room exists. Please enter a valid room ID.');
    });
    socket.on('youCanStart', (id) => {
        if (socket.id == id) {
            $('#room_start_btn').removeClass('invisible')
        }
    });
    socket.on('dontStart', () => {
        $('#room_start_btn').addClass('invisible')
    })
    // Listen for 'noSuchRoom' event from the server
    socket.on('roomFull', () => {
        $('.pvt-modal-body').addClass('d-none');
        $('#private_body').removeClass('d-none');
        alert(`Room : ${roomID} if full`);
    });
    socket.on('playerLeft', (players) => {
        updatePlayersList(players);
    })
    socket.on('preRound', (word) => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);

        canvas.removeEventListener('touchstart', handleTouchStart, false);
        canvas.removeEventListener('touchmove', handleTouchMove, false);
        canvas.removeEventListener('touchend', handleTouchEnd, false);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas;
        const wordContainer = document.getElementById('wordContainer');
        wordContainer.innerHTML = '';
        wordContainer.textContent = 'Answer is: ' + word;
    })
    socket.on('endGame', (roomID, players) => {
        $('.loader-wrapper').addClass('d-none');
        if ($('#sound_off').hasClass('d-none')) {
            end_audio.play();
        }
        document.getElementById('timer').textContent = 0;
        $('#leaderboard').modal({ backdrop: 'static', keyboard: false });
        $('#leaderboard').modal('show');
        updateLeaderBoard(players);
        socket.emit('closeGame', roomID);
    })
    $('#room_start_btn').click(function () {
        socket.emit('startGame', roomID);
        if ($('#sound_off').hasClass('d-none')) {
            start_audio.play();
        }
    })
    socket.on('newRound', (drawerId, drawerName) => {
        const wordContainer = document.getElementById('wordContainer');
        wordContainer.innerHTML = '';
        $("#private_rules").modal('hide');
        $('.game-container').removeClass('d-none');
        $('.loader-wrapper').addClass('d-none');
        $('.hide-for-both').addClass('d-none');
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket.id === drawerId) {
            // to draw on mouse events
            generateRandomWords();
            $('.brush-container').removeClass('d-none');
            $('.brush-container').addClass('d-flex flex-column align-items-center justify-content-center');
            $('#typebox').addClass('d-none');
            $('.hide-for-guesser').removeClass('d-none');

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
            $('#random_word_modal').modal('hide');
            $('#start_guessing').text(`${drawerName} is Choosing a Word to Draw`);
            $('.loader-wrapper').removeClass('d-none');
            $('.hide-for-guesser').addClass('d-none');

            // Disable drawing for non-current drawers
            $('.brush-container').addClass('d-none');
            $('.brush-container').removeClass('d-flex flex-column align-items-center justify-content-center');
            $('#typebox').removeClass('d-none');
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);

            canvas.removeEventListener('touchstart', handleTouchStart, false);
            canvas.removeEventListener('touchmove', handleTouchMove, false);
            canvas.removeEventListener('touchend', handleTouchEnd, false);
        }
    });
    $('#word_start').click(function () {
        const word = $('.random-word-btn.selected').val();
        if (word) {
            socket.emit('currentWord', roomID, word);
        }
    })
    function createStars(n) {
        let stars = '';
        for (let i = 0; i < n; i++) {
            stars += '*';
        }
        return stars;
    }
    socket.on('drawerChoseWord', (roomID, drawerId, wordLength) => {
        $('.loader-wrapper').addClass('d-none');
        if (socket.id === drawerId) {
            // $('.loader-wrapper').addClass('d-none');
        }
        else {
            displayWord(createStars(wordLength));
        }
    })
    socket.on('roundTime', (timer) => {
        updateRoundTimer(timer);
    })
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
        // const endX = touch.pageX - canvas.offsetLeft;
        // const endY = touch.pageY - canvas.offsetTop;
        const endX = touch.clientX - canvas.getBoundingClientRect().left;
        const endY = touch.clientY - canvas.getBoundingClientRect().top;
        const color = $('#colorValue').val();
        const lineWidth = document.getElementById('brushSize').value;
        drawLine(startX, startY, endX, endY, color, lineWidth, isErasing);
        socket.emit('drawing', { startX, startY, endX, endY, color, lineWidth, isErasing, roomID });
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
        const color = $('#colorValue').val();
        const lineWidth = document.getElementById('brushSize').value;
        drawLine(startX, startY, endX, endY, color, lineWidth, isErasing);
        socket.emit('drawing', { startX, startY, endX, endY, color, lineWidth, isErasing, roomID });
        [lastX, lastY] = [endX, endY];
    }
    // Function to draw a line on the canvas
    function drawLine(startX, startY, endX, endY, color, lineWidth, isErasing) {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = isErasing ? '#FFFFFF' : color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // Start a new path
        ctx.beginPath();

        // Set the line style
        ctx.lineWidth = lineWidth;

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

    $('#eraser').click(function () {
        isErasing = true;
        $('#eraser svg path').css('fill', '#3498db');
        $('#eraser').css('border', '1px solid #3498db');

        $('#paint svg path').css('fill', '#d9d9d9');
        $('#paint').css('border', '1px solid #d9d9d9');
    })
    $('#paint').click(() => {
        isErasing = false;
        $('#eraser svg path').css('fill', '#d9d9d9');
        $('#eraser').css('border', '1px solid #d9d9d9');

        $('#paint svg path').css('fill', '#3498db');
        $('#paint').css('border', '1px solid #3498db');
    })

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
    $('#clear').click(function () {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingData = [];
        socket.emit('clear', roomID);
    });
    socket.on('clear', () => {
        const canvas = document.getElementById('canva_board');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingData = [];
    })
    // Listen for 'drawing' event from other players
    socket.on('drawing', ({ startX, startY, endX, endY, color, lineWidth, isErasing }) => {
        drawLine(startX, startY, endX, endY, color, lineWidth, isErasing);
    });
    document.getElementById('guess_submit').addEventListener('submit', function (event) {
        checkGuess(event);
    })
    $('#submit_guess_icon').click(function (event) {
        checkGuess(event);
    })
    function checkGuess() {
        event.preventDefault();
        const inputValue = $('#type_guess').val()
        console.log(inputValue);
        socket.emit('checkGuess', socket.id, roomID, playerName, playerImage, inputValue);
        $('#type_guess').val('');
    }
    socket.on('guessResult', (playerName, playerImage, sentGuess, bonusScore) => {
        const correct_audio = document.getElementById('correct_sound');
        var listItem = document.createElement('li');
        const chatList = document.getElementById('chat_list');
        listItem.classList.add('chat-item', 'py-1');
        imageSrc = playerImage;
        const img = `<img src=${imageSrc} alt='user-image'></img>`;
        console.log(sentGuess);
        if (sentGuess === 'correct') {
            if ($('#sound_off').hasClass('d-none')) {
                correct_audio.play();
            }
            listItem.innerHTML = img + `<span class='guess-word-chat px-1'>Correct!<span>` + svg;
            $('#start_guessing').text('Your Guess is Right!');
        }
        else {
            listItem.innerHTML = img + `<span class='guess-word-chat px-1'>${sentGuess}<span>`;
        }
        chatList.appendChild(listItem);
        chatList.scrollTop = chatList.scrollHeight;
    })

    function displayWord(word) {
        const wordContainer = document.getElementById('wordContainer');
        wordContainer.innerHTML = ''; // Clear previous content
        // Iterate over each letter in the word
        for (let i = 0; i < word.trim().length; i++) {
            // Create a span element for the letter
            const letterSpan = document.createElement('span');
            //   letterSpan.textContent = word[i];
            letterSpan.classList.add('letter'); // Add the letter class

            // Append the letter span to the word container
            wordContainer.appendChild(letterSpan);
        }
    }
}
function updateRoundTimer(timer) {
    const timerDisplay = document.getElementById('timer');
    timerDisplay.classList.add('countdown');
    document.getElementById('timer').textContent = timer; // Update the timer display

}
function updateLeaderBoard(players) {
    $('#leaderboard_count').text(players.length);
    const playerData = document.getElementById('playerData');
    playerData.innerHTML = '';
    players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td class='d-flex align-items-center'>
                    <img src="${player.imageurl}" width="24" height="24" class='rounded-circle'><p class='m-0 ms-2'>${player.name}</p>
                </td>
                <td><p class='m-0'>${player.gameScore}</p></td>
                <td class='d-flex align-items-center'>
                    <p class='m-0'>${player.gameScore + player.guessCount * 10}</p>
                    <img src="media/images/rewards.png" alt="rewards-img" width="24" height="24" class="ms-1">
                </td>
            `;
        playerData.appendChild(row);
    });
}
// Function to update the list of players in the room
function updatePlayersList(players) {
    $('#players_count').text(players.length);
    const playersListElement = document.getElementById('playersList');
    // Clear the existing list
    playersListElement.innerHTML = '';
    // Iterate through the players array and add each player to the list
    players.forEach(player => {
        const container = document.createElement('div');
        container.classList.add('d-flex', 'align-items-center', 'mb-1');
        const playerImage = document.createElement('img');
        playerImage.src = player.imageurl ? player.imageurl : 'media/images/avatars/panda.svg';
        playerImage.setAttribute("id", "user_image");
        const playerElement = document.createElement('div');
        playerElement.textContent = player.name;
        playerElement.classList.add('mx-2');
        playerElement.setAttribute("id", "get_username");
        container.appendChild(playerImage);
        container.appendChild(playerElement);
        playersListElement.appendChild(container);
    });
}

// Function to update the countdown timer on the UI
function updateCountdownTimer(countdownTime) {
    const countdownTimerElement = document.getElementById('countdownTimer');
    // Calculate minutes and seconds from countdownTime
    const minutes = Math.floor(countdownTime / 60000);
    const seconds = Math.floor((countdownTime % 60000) / 1000);

    // Format the minutes and seconds (add leading zeros if necessary)
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update the countdown timer element
    countdownTimerElement.textContent = formattedTime;
}


// Add an event listener for the beforeunload event
window.addEventListener('beforeunload', function (event) {
    if (reload) {
        // Cancel the default action (showing the default confirmation dialog)
        event.preventDefault();
        // Show a custom confirmation message
        event.returnValue = '';
        // You can customize the message to fit your needs
        const confirmationMessage = 'Are you sure you want to exit?';
        // Returning the custom message will prompt the user with a confirmation dialog
        return confirmationMessage;
    }
});

// Function to save the canvas as an image
function saveCanvasAsImage() {
    // Get the canvas element
    const canvas = document.getElementById('canva_board');
    const fileName = window.prompt('Save as: (should save in .png format)', 'canvas_image.png');
    if (!fileName) return;
    // Get the data URL representing the canvas content
    const dataURL = canvas.toDataURL();

    // Create a link element to download the image
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataURL;

    // Simulate a click on the link to trigger the download
    link.click();
}