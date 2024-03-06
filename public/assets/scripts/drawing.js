const canvas = document.getElementById('canva_board');
const context = canvas.getContext('2d');

let drawing = false;
let history = [];
let historyIndex = -1;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

function startDrawing(event) {
  drawing = true;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
}

function draw(event) {
  if (drawing) {
    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
  }
}

function endDrawing() {
  if (drawing) {
    context.closePath();
    if (!event.type.includes('mouseout')) {
      saveDrawing();
    }
    drawing = false;
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
    img.onload = function() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
    img.src = history[historyIndex];
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const img = new Image();
    img.onload = function() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
    img.src = history[historyIndex];
  }
}
