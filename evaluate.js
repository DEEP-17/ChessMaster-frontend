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
        if (piece) {
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
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare
    });

    const chess = new Chess();
    const stockfish = new Worker('stockfish.js');
    let isWhiteTurn = true;
    let moveHistory = [];
    let currentMoveIndex = -1;
    let pendingMove = null;

    // Promotion dialog elements
    const promotionDialog = document.getElementById('promotion-dialog');
    const overlay = document.getElementById('overlay');
    const promotionOptions = document.querySelectorAll('.promotion-option');

    promotionOptions.forEach(option => {
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
                    isWhiteTurn = chess.turn() === 'w';
                    moveHistory = chess.history();
                    currentMoveIndex = moveHistory.length - 1;
                    board.position(chess.fen());
                    analyzePosition();
                    updatePGNDisplay();
                }
            }
            hidePromotionDialog();
        });
    });

    function showPromotionDialog() {
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

    document.getElementById('load-pgn').addEventListener('click', () => {
        const pgn = document.getElementById('pgn-input').value;
        if (chess.load_pgn(pgn)) {
            moveHistory = chess.history();
            currentMoveIndex = moveHistory.length - 1;
            board.position(chess.fen());
            analyzePosition();
            updatePGNDisplay();
        } else {
            alert('Invalid PGN');
        }
    });

    function handleMove(source, target) {
        removeHighlightedSquares();

        // Check if it's a pawn promotion move
        if (isPawnPromotion(source, target)) {
            pendingMove = { from: source, to: target };
            showPromotionDialog();
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

        isWhiteTurn = chess.turn() === 'w';
        moveHistory = chess.history();
        currentMoveIndex = moveHistory.length - 1;
        board.position(chess.fen());
        analyzePosition();
        updatePGNDisplay();
    }

    function analyzePosition() {
        stockfish.postMessage('position fen ' + chess.fen());
        stockfish.postMessage('go depth 15');
    }

    stockfish.onmessage = function (event) {
        const message = event.data;
        if (message.startsWith('info') && message.includes('score')) {
            const evalMatch = message.match(/score (cp|mate) (-?\d+)/);
            const cp = evalMatch && evalMatch[1] === 'cp' ? parseInt(evalMatch[2]) : null;
            const mate = evalMatch && evalMatch[1] === 'mate' ? parseInt(evalMatch[2]) : null;

            if (cp !== null || mate !== null) {
                updateEvalBar(cp, mate);
            }
        }

        if (message.startsWith('info') && message.includes('pv')) {
            suggestMoves(message);
        }
    };

    function updateEvalBar(cp, mate) {
        const whiteBar = document.getElementById('white-bar');
        const blackBar = document.getElementById('black-bar');
        const whiteEval = document.getElementById('white-eval');
        const blackEval = document.getElementById('black-eval');

        const evaluation = cp !== null ? cp / 100 : (mate > 0 ? 10 : -10);

        const whiteHeight = Math.max(0, 200 + evaluation * 20);
        const blackHeight = 400 - whiteHeight;

        whiteBar.style.height = `${whiteHeight}px`;
        blackBar.style.height = `${blackHeight}px`;

        whiteEval.textContent = evaluation < 0 ? `${(evaluation).toFixed(2)}` : '';
        blackEval.textContent = evaluation > 0 ? `${(evaluation).toFixed(2)}` : '';

        const status = document.querySelector('.top-moves h3');
        if (mate !== null) {
            status.textContent = mate > 0
                ? isWhiteTurn
                    ? 'White is winning by checkmate!'
                    : 'Black is winning by checkmate!'
                : '';
        } else if (evaluation > 1) {
            status.textContent = 'White has a significant advantage!';
        } else if (evaluation < -1) {
            status.textContent = 'Black has a significant advantage!';
        } else {
            status.textContent = 'The game is balanced.';
        }
    }

    function suggestMoves(message) {
        const movesList = document.getElementById('move-suggestions');
        const moveLines = message.split(' pv ');
        const evaluations = [];

        if (moveLines.length > 1) {
            const evalMatch = message.match(/score (cp|mate) (-?\d+)/);
            const evaluation = evalMatch ? (evalMatch[1] === 'cp' ? parseFloat(evalMatch[2]) / 100 : `M${evalMatch[2]}`) : null;
            
            const pvString = moveLines[1].trim();
            const moveSequence = pvString.split(' ');

            evaluations.push({
                eval: evaluation,
                moves: moveSequence.slice(0, 15).join(' ')
            });

            if (evaluations.length > 3) {
                evaluations.length = 3;
            }

            movesList.innerHTML = evaluations.map((line, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${typeof line.eval === 'number' ? line.eval.toFixed(2) : line.eval}</td>
                    <td>${line.moves}</td>
                </tr>
            `).join('');
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

    document.getElementById('first-move').addEventListener('click', () => {
        if (moveHistory.length === 0) return;
        currentMoveIndex = -1;
        chess.reset();
        board.position(chess.fen());
        analyzePosition();
        updatePGNDisplay();
    });

    document.getElementById('prev-move').addEventListener('click', () => {
        if (currentMoveIndex < 0) return;
        chess.undo();
        currentMoveIndex--;
        board.position(chess.fen());
        analyzePosition();
        updatePGNDisplay();
    });

    document.getElementById('next-move').addEventListener('click', () => {
        if (currentMoveIndex >= moveHistory.length - 1) return;
        currentMoveIndex++;
        chess.move(moveHistory[currentMoveIndex]);
        board.position(chess.fen());
        analyzePosition();
        updatePGNDisplay();
    });

    document.getElementById('last-move').addEventListener('click', () => {
        if (moveHistory.length === 0) return;
        chess.reset();
        moveHistory.forEach(move => chess.move(move));
        currentMoveIndex = moveHistory.length - 1;
        board.position(chess.fen());
        analyzePosition();
        updatePGNDisplay();
    });

    window.addEventListener('resize', board.resize);
});