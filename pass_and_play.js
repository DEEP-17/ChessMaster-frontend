document.addEventListener('DOMContentLoaded', function () {
    const board = Chessboard('board', {
        draggable: true,
        position: 'start',
        pieceTheme: 'images/pieces/{piece}.png',
        onDrop: handleMove
    });

    const chess = new Chess();
    let whiteTime = 300; // 5 minutes in seconds
    let blackTime = 300; // 5 minutes in seconds
    let whiteClock, blackClock;
    let currentPlayer = 'white';
    let lastMove = null;
    let moveHistory = [];
    let currentMoveIndex = -1;
    let gameActive = true;

    // Handle window resize
    window.addEventListener('resize', board.resize);

    $('#start-game').on('click', function () {
        whiteTime = parseInt($('#white-time').val()) * 60;
        blackTime = parseInt($('#black-time').val()) * 60;
        updateClocks();
        chess.reset();
        board.position('start');
        currentPlayer = 'white';
        startWhiteClock();
        clearHighlights();
        moveHistory = [];
        currentMoveIndex = -1;
        updatePGNDisplay();
        gameActive = true;
    });

    function handleMove(source, target) {
        if (!gameActive) return 'snapback';

        const move = chess.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen
        });

        if (move === null) {
            return 'snapback'; // Invalid move
        }

        moveHistory = chess.history();
        currentMoveIndex = moveHistory.length - 1;
        board.position(chess.fen());
        board.orientation(currentPlayer === 'white' ? 'black' : 'white');
        highlightMove(source, target);
        switchClocks();
        updatePGNDisplay();
        if (chess.game_over()) {
            stopClocks();
            gameActive = false;
            if (chess.in_checkmate()) {
                alert(`${currentPlayer === 'white' ? 'Black' : 'White'} wins by checkmate!`);
            } else if (chess.in_draw()) {
                alert("Game drawn!");
            } else if (chess.in_stalemate()) {
                alert("Game drawn by stalemate!");
            }
        }
    }

    function updateClocks() {
        $('#white-clock').text(`White: ${formatTime(whiteTime)}`);
        $('#black-clock').text(`Black: ${formatTime(blackTime)}`);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function startWhiteClock() {
        clearInterval(blackClock);
        whiteClock = setInterval(() => {
            whiteTime--;
            updateClocks();
            if (whiteTime <= 0) {
                alert('Black wins on time!');
                stopClocks();
                gameActive = false;
            }
        }, 1000);
    }

    function startBlackClock() {
        clearInterval(whiteClock);
        blackClock = setInterval(() => {
            blackTime--;
            updateClocks();
            if (blackTime <= 0) {
                alert('White wins on time!');
                stopClocks();
                gameActive = false;
            }
        }, 1000);
    }

    function switchClocks() {
        if (currentPlayer === 'white') {
            currentPlayer = 'black';
            startBlackClock();
        } else {
            currentPlayer = 'white';
            startWhiteClock();
        }
    }

    function stopClocks() {
        clearInterval(whiteClock);
        clearInterval(blackClock);
    }

    function highlightMove(source, target) {
        clearHighlights();
        $(`#board .square-${source}`).addClass('highlight');
        $(`#board .square-${target}`).addClass('highlight');
        lastMove = { source, target };
    }

    function clearHighlights() {
        if (lastMove) {
            $(`#board .square-${lastMove.source}`).removeClass('highlight');
            $(`#board .square-${lastMove.target}`).removeClass('highlight');
        }
    }

    function updatePGNDisplay() {
        const moves = chess.history();
        let formattedPGN = '';
        for (let i = 0; i < moves.length; i++) {
            if (i % 2 === 0) {
                formattedPGN += `${Math.floor(i / 2) + 1}. ${moves[i]} `;
            } else {
                formattedPGN += `${moves[i]}\n`;
            }
        }
        $('#pgn-display').text(formattedPGN.trim() || 'Game moves will appear here...');
    }

    $('#copy-pgn').on('click', function () {
        navigator.clipboard.writeText(chess.pgn());
        alert('PGN copied to clipboard!');
    });

    $('#draw').on('click', function () {
        if (!gameActive) return;
        if (confirm('Are you sure you want to draw the game?')) {
            alert('Game drawn by agreement!');
            stopClocks();
            gameActive = false;
        }
    });

    $('#white-resign').on('click', function () {
        if (!gameActive) return;
        if (confirm('Are you sure White wants to resign?')) {
            alert('White resigns! Black wins!');
            stopClocks();
            gameActive = false;
        }
    });

    $('#black-resign').on('click', function () {
        if (!gameActive) return;
        if (confirm('Are you sure Black wants to resign?')) {
            alert('Black resigns! White wins!');
            stopClocks();
            gameActive = false;
        }
    });

    $('#first-move').on('click', function () {
        if (moveHistory.length === 0) return;
        currentMoveIndex = 0;
        chess.reset();
        for (let i = 0; i < currentMoveIndex; i++) {
            chess.move(moveHistory[i]);
        }
        board.position(chess.fen());
        updatePGNDisplay();
    });

    $('#prev-move').on('click', function () {
        if (currentMoveIndex < 0) return;
        chess.undo();
        currentMoveIndex--;
        board.position(chess.fen());
        updatePGNDisplay();
    });

    $('#next-move').on('click', function () {
        if (currentMoveIndex >= moveHistory.length - 1) return;
        currentMoveIndex++;
        chess.move(moveHistory[currentMoveIndex]);
        board.position(chess.fen());
        updatePGNDisplay();
    });

    $('#last-move').on('click', function () {
        if (moveHistory.length === 0) return;
        currentMoveIndex = moveHistory.length - 1;
        chess.reset();
        for (let i = 0; i <= currentMoveIndex; i++) {
            chess.move(moveHistory[i]);
        }
        board.position(chess.fen());
        updatePGNDisplay();
    });
});