document.addEventListener('DOMContentLoaded', function () {
    const board = Chessboard('board', {
        draggable: true,
        position: 'start',
        pieceTheme: 'images/pieces/{piece}.png',
        onDrop: handlePlayerMove
    });

    const chess = new Chess();
    const stockfish = new Worker('stockfish.js');
    let playerColor = 'white';
    let stockfishDepth = 10;
    let gameInProgress = false;
    let moveHistory = [];
    let currentMoveIndex = 0;

    // Handle window resize
    window.addEventListener('resize', board.resize);

    $('#start-game').on('click', function () {
        playerColor = $('#color-select').val();
        stockfishDepth = parseInt($('#difficulty-select').val());
        gameInProgress = true;
        chess.reset();
        board.position('start');
        board.orientation(playerColor);
        moveHistory = [];
        currentMoveIndex = 0;
        updatePGNDisplay();
        if (playerColor === 'black') makeStockfishMove();
    });

    $('#resign-button').on('click', function () {
        if (!gameInProgress) return;
        if (confirm('Are you sure you want to resign?')) {
            alert(`${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} resigns! Stockfish wins!`);
            gameInProgress = false;
        }
    });

    function handlePlayerMove(source, target) {
        if (!gameInProgress || chess.turn() !== playerColor[0]) return 'snapback';

        const move = chess.move({ from: source, to: target, promotion: 'q' });
        if (!move) return 'snapback';

        moveHistory = chess.history();
        currentMoveIndex = moveHistory.length;
        updatePGNDisplay();
        board.position(chess.fen());

        if (chess.game_over()) {
            handleGameOver();
        } else {
            makeStockfishMove();
        }
    }

    function makeStockfishMove() {
        stockfish.postMessage(`position fen ${chess.fen()}`);
        stockfish.postMessage(`go depth ${stockfishDepth}`);
    }

    function handleGameOver() {
        gameInProgress = false;
        let message = '';
        if (chess.in_checkmate()) {
            message = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
        } else if (chess.in_draw()) {
            message = "Game Over! It's a draw!";
        } else if (chess.in_stalemate()) {
            message = "Game Over! Stalemate!";
        }
        if (message) alert(message);
    }

    stockfish.onmessage = function (event) {
        if (event.data.startsWith('bestmove')) {
            const bestMove = event.data.split(' ')[1];
            chess.move({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: 'q' });
            moveHistory = chess.history();
            currentMoveIndex = moveHistory.length;
            updatePGNDisplay();
            board.position(chess.fen());

            if (chess.game_over()) {
                handleGameOver();
            }
        }
    };

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

    $('#first-move').on('click', function () {
        currentMoveIndex = 0;
        navigateToMove();
    });

    $('#prev-move').on('click', function () {
        if (currentMoveIndex > 0) currentMoveIndex--;
        navigateToMove();
    });

    $('#next-move').on('click', function () {
        if (currentMoveIndex < moveHistory.length) currentMoveIndex++;
        navigateToMove();
    });

    $('#last-move').on('click', function () {
        currentMoveIndex = moveHistory.length;
        navigateToMove();
    });

    function navigateToMove() {
        chess.reset();
        for (let i = 0; i < currentMoveIndex; i++) {
            chess.move(moveHistory[i]);
        }
        board.position(chess.fen());
        updatePGNDisplay();
    }
});