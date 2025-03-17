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
        if (!gameActive) return;
        
        const pieceColor = piece ? piece.charAt(0) : null;
        
        if ((currentPlayer === 'white' && pieceColor === 'w') ||
            (currentPlayer === 'black' && pieceColor === 'b')) {
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
        onDrop: handleMove,
        onDragStart: onDragStart,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare
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
    let pendingPromotion = null;

    function onDragStart(source, piece) {
        if (!gameActive) return false;

        if ((currentPlayer === 'white' && piece.search(/^b/) !== -1) ||
            (currentPlayer === 'black' && piece.search(/^w/) !== -1)) {
            return false;
        }

        highlightLegalMoves(source);
        return true;
    }

    function updatePromotionImages(color) {
        const pieces = ['queen', 'rook', 'bishop', 'knight'];
        pieces.forEach(piece => {
            const img = document.getElementById(`promotion-${piece}`);
            img.src = `images/pieces/${color}${piece.charAt(0).toUpperCase()}.png`;
        });
    }

    function showPromotionDialog(color) {
        updatePromotionImages(color);
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('promotion-dialog').style.display = 'block';
    }

    function hidePromotionDialog() {
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('promotion-dialog').style.display = 'none';
    }

    document.querySelectorAll('.promotion-piece').forEach(piece => {
        piece.addEventListener('click', function() {
            if (pendingPromotion) {
                const promotionPiece = this.getAttribute('data-piece');
                const move = chess.move({
                    from: pendingPromotion.source,
                    to: pendingPromotion.target,
                    promotion: promotionPiece
                });

                if (move) {
                    moveHistory = chess.history();
                    currentMoveIndex = moveHistory.length - 1;
                    board.position(chess.fen());
                    board.orientation(currentPlayer === 'white' ? 'black' : 'white');
                    highlightMove(pendingPromotion.source, pendingPromotion.target);
                    switchClocks();
                    updatePGNDisplay();
                    
                    if (chess.game_over()) {
                        playEndSound();
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
                
                pendingPromotion = null;
                hidePromotionDialog();
            }
        });
    });

    function handleMove(source, target) {
        removeHighlightedSquares();
        
        if (!gameActive) return 'snapback';

        const piece = chess.get(source);
        const isPromotion = piece && 
            piece.type === 'p' && 
            ((piece.color === 'w' && target.charAt(1) === '8') || 
             (piece.color === 'b' && target.charAt(1) === '1'));

        if (isPromotion) {
            pendingPromotion = { source, target };
            showPromotionDialog(piece.color === 'w' ? 'w' : 'b');
            return 'snapback';
        }

        const move = chess.move({
            from: source,
            to: target
        });

        if (move === null) {
            return 'snapback';
        }

        // Play appropriate sound effect
        playMoveSound(move, chess);

        moveHistory = chess.history();
        currentMoveIndex = moveHistory.length - 1;
        board.position(chess.fen());
        board.orientation(currentPlayer === 'white' ? 'black' : 'white');
        highlightMove(source, target);
        switchClocks();
        updatePGNDisplay();

        if (chess.game_over()) {
            playEndSound();
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

    $('#start-game').on('click', function () {
        playStartSound();
        whiteTime = parseInt($('#white-time').val()) * 60;
        blackTime = parseInt($('#black-time').val()) * 60;
        updateClocks();
        chess.reset();
        board.position('start');
        currentPlayer = 'white';
        startWhiteClock();
        clearHighlights();
        removeHighlightedSquares();
        moveHistory = [];
        currentMoveIndex = -1;
        updatePGNDisplay();
        gameActive = true;
    });

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

    window.addEventListener('resize', board.resize);
});