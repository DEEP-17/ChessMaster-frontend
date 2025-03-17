document.addEventListener('DOMContentLoaded', function () {
    // Sound effects setup
    const moveSound = new Audio('./sounds/move.mp3');
    const captureSound = new Audio('./sounds/capture.mp3');
    const checkSound = new Audio('./sounds/check.mp3');
    const castleSound = new Audio('./sounds/castle.mp3');
    const startSound = new Audio('./sounds/start.mp3');
    const endSound = new Audio('./sounds/end.mp3');

    function playMoveSound(move, chess) {
        if (!move) return;

        // Check if it's a castle move
        if (move.san === 'O-O' || move.san === 'O-O-O') {
            castleSound.play();
            return;
        }

        // Check if it's a capture move
        if (move.captured) {
            captureSound.play();
            return;
        }

        // Check if it puts opponent in check
        if (chess.in_check()) {
            checkSound.play();
            return;
        }

        // Regular move
        moveSound.play();
    }

    function playStartSound() {
        startSound.play();
    }

    function playEndSound() {
        endSound.play();
    }

    // Move highlighting functions
    function removeHighlightedSquares() {
        $('.square-55d63').find('.legal-move-dot').remove();
    }

    function highlightLegalMoves(square) {
        const moves = chess.moves({
            square: square,
            verbose: true
        });

        if (moves.length === 0) return;

        moves.forEach(move => {
            const $square = $(`#board .square-${move.to}`);
            if (!$square.find('.legal-move-dot').length) {
                $square.append('<div class="legal-move-dot"></div>');
            }
        });
    }

    function onMouseoverSquare(square, piece) {
        if (!gameInProgress) return;
        
        const pieceColor = piece ? piece.charAt(0) : null;
        
        if ((playerColor === 'white' && pieceColor === 'w') ||
            (playerColor === 'black' && pieceColor === 'b')) {
            highlightLegalMoves(square);
        }
    }

    function onMouseoutSquare() {
        removeHighlightedSquares();
    }

    const board = Chessboard('board', {
        draggable: true,
        position: 'start',
        pieceTheme: 'images/pieces/{piece}.png',
        onDrop: handlePlayerMove,
        onDragStart: onDragStart,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare
    });

    const chess = new Chess();
    const stockfish = new Worker('stockfish.js');
    let playerColor = 'white';
    let stockfishDepth = 10;
    let gameInProgress = false;
    let moveHistory = [];
    let currentMoveIndex = 0;
    let pendingMove = null;

    function onDragStart(source, piece) {
        if (!gameInProgress || chess.turn() !== playerColor[0]) return false;

        if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
            (playerColor === 'black' && piece.search(/^w/) !== -1)) {
            return false;
        }

        highlightLegalMoves(source);
        return true;
    }

    function showPromotionDialog() {
        const promotionDialog = document.getElementById('promotion-dialog');
        const overlay = document.getElementById('overlay');
        const isWhite = chess.turn() === 'w';
        
        // Update piece images based on the current player's color
        const pieces = promotionDialog.querySelectorAll('.promotion-option img');
        pieces.forEach(img => {
            const piece = img.parentElement.getAttribute('data-piece');
            img.src = `images/pieces/${isWhite ? 'w' : 'b'}${piece.toUpperCase()}.png`;
        });

        promotionDialog.classList.add('active');
        overlay.classList.add('active');
    }

    function hidePromotionDialog() {
        const promotionDialog = document.getElementById('promotion-dialog');
        const overlay = document.getElementById('overlay');
        promotionDialog.classList.remove('active');
        overlay.classList.remove('active');
        pendingMove = null;
    }

    function isPawnPromotion(source, target) {
        const piece = chess.get(source);
        return piece && 
               piece.type === 'p' && 
               ((piece.color === 'w' && target[1] === '8') || 
                (piece.color === 'b' && target[1] === '1'));
    }

    document.querySelectorAll('.promotion-option').forEach(option => {
        option.addEventListener('click', function() {
            const piece = this.getAttribute('data-piece');
            if (pendingMove) {
                const move = chess.move({
                    from: pendingMove.from,
                    to: pendingMove.to,
                    promotion: piece
                });

                if (move) {
                    playMoveSound(move, chess);
                    board.position(chess.fen());
                    moveHistory = chess.history();
                    currentMoveIndex = moveHistory.length;
                    updatePGNDisplay();

                    if (chess.game_over()) {
                        playEndSound();
                        handleGameOver();
                    } else {
                        makeStockfishMove();
                    }
                }
                hidePromotionDialog();
            }
        });
    });

    $('#start-game').on('click', function () {
        playStartSound();
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
            playEndSound();
            alert(`${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} resigns! Stockfish wins!`);
            gameInProgress = false;
        }
    });

    function handlePlayerMove(source, target) {
        if (!gameInProgress || chess.turn() !== playerColor[0]) return 'snapback';

        removeHighlightedSquares();

        // Check if it's a pawn promotion move
        if (isPawnPromotion(source, target)) {
            pendingMove = { from: source, to: target };
            showPromotionDialog();
            return 'snapback';
        }

        const move = chess.move({ from: source, to: target });
        if (!move) return 'snapback';

        // Play appropriate sound effect
        playMoveSound(move, chess);

        moveHistory = chess.history();
        currentMoveIndex = moveHistory.length;
        updatePGNDisplay();
        board.position(chess.fen());

        if (chess.game_over()) {
            playEndSound();
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
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
            
            const move = chess.move({ from, to, promotion });
            if (move) {
                playMoveSound(move, chess);
            }
            
            moveHistory = chess.history();
            currentMoveIndex = moveHistory.length;
            updatePGNDisplay();
            board.position(chess.fen());

            if (chess.game_over()) {
                playEndSound();
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

    window.addEventListener('resize', board.resize);
});