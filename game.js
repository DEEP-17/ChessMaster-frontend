// const socket = io("https://chess-game-backend-z158.onrender.com");
//      var board = null;
//      var count=0;
//     var game = new Chess();
//     var $status = $('#status');
//     var $fen = $('#fen');
//     var $pgn = $('#pgn');
//     let c_player = null;
//     let timerinstance = null;
//     let opponentTimerInstance = null;
//     let currentmatchtime = null;
//     let moveHistory = [];
//     let currentMoveIndex = -1;
//     let isWaitingForMatch = false;
//     let positionHistory = [];
//     let pendingPromotion = null;
//     let playerName = '';
//     // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     // let result = '';
//     // const length = 10;
//     // for (let i = 0; i < length; i++) {
//     //     result += characters.charAt(Math.floor(Math.random() * characters.length));
//     // }
//     // console.log(result);
//     const userData = localStorage.getItem('chessmaster_user');
//     const user = JSON.parse(userData);
//     playerName =  user.username;
//     socket.emit('register_name', playerName);
//     // Sounds
//     const moveSound = new Audio('./sounds/move.mp3');
//     const captureSound = new Audio('./sounds/capture.mp3');
//     const checkSound = new Audio('./sounds/check.mp3');
//     const castleSound = new Audio('./sounds/castle.mp3');
//     const startSound = new Audio('./sounds/start.mp3');
//     const endSound = new Audio('./sounds/end.mp3');

//     function recordPosition() {
//         const position = game.fen().split(' ').slice(0, 4).join(' ');
//         positionHistory.push(position);
//         return checkThreefoldRepetition(position);
//     }

//     function checkThreefoldRepetition(position) {
//         return positionHistory.filter(pos => pos === position).length == 2;
//     }

//     function showGameResultModal(isWinner, reason = '') {
//         const modal = document.getElementById('game-result-modal');
//         const title = document.getElementById('result-title');
//         const icon = document.getElementById('result-icon');
//         const message = document.getElementById('result-message');

//         if (isWinner === null) {
//             title.textContent = 'Draw';
//             icon.innerHTML = '🤝';
//             message.textContent = reason || 'The game is a draw!';
//         } else if (isWinner) {
//             title.textContent = 'Victory!';
//             icon.innerHTML = '👑';
//             message.textContent = reason ? `You won! ${reason}` : 'Congratulations! You have won the game!';
//         } else {
//             title.textContent = 'Defeat';
//             icon.innerHTML = '💔';
//             message.textContent = reason ? `You lost. ${reason}` : 'Better luck next time!';
//         }

//         modal.style.display = 'flex';
//         endSound.play();

//         document.querySelector('.modal-close').onclick = () => {
//             modal.style.display = 'none';
//             window.location.reload();
//         };

//         modal.onclick = (e) => {
//             if (e.target === modal) {
//                 modal.style.display = 'none';
//                 window.location.reload();
//             }
//         };
//     }

//     import {quotes} from './chess_quotes.js';
//     function displayRandomQuote() {
//         const randomIndex = Math.floor(Math.random() * quotes.length);
//         const [quote, author] = quotes[randomIndex];
//         document.getElementById("waiting_text").innerHTML = `Waiting for Opponent...<br><br>"${quote}"<br><span style="font-weight: bold;">-- ${author}</span>`;
//     }

//     function removeHighlights() {
//         $('#Board1 .square-55d63').removeClass('highlight check');
//         $('#Board1 .square-55d63').find('.legal-dot').remove();
//     }

//     function highlightSquare(square) {
//         const $square = $('#Board1 .square-' + square);
//         if ($square.find('.legal-dot').length === 0) {
//             $square.append('<div class="legal-dot"></div>');
//         }
//     }

//     function showLegalMoves(piece, source) {
//         const moves = game.moves({
//             square: source,
//             verbose: true
//         });
//         moves.forEach(move => highlightSquare(move.to));
//     }

//     function onDragStart(source, piece, position, orientation) {
//         if (game.turn() !== c_player) {
//             return false;
//         }
//         if (game.game_over()) return false;
//         if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
//             (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
//             return false;
//         }
//         removeHighlights();
//         showLegalMoves(piece, source);
//     }

//     function showPromotionModal(color) {
//         const modal = document.querySelector('.promotion-modal');
//         const pieces = modal.querySelectorAll('.promotion-piece');

//         pieces.forEach(piece => {
//             const currentSrc = piece.src;
//             piece.src = currentSrc.replace(/[wb](?=[qrbn])/, color);
//         });

//         modal.style.display = 'flex';

//         pieces.forEach(piece => {
//             piece.onclick = () => handlePromotion(piece.dataset.piece);
//         });
//     }

//     function handlePromotion(promotionPiece) {
//         const modal = document.querySelector('.promotion-modal');
//         modal.style.display = 'none';

//         if (!pendingPromotion) return;

//         const move = game.move({
//             from: pendingPromotion.source,
//             to: pendingPromotion.target,
//             promotion: promotionPiece
//         });

//         if (move === null) return 'snapback';

//         captureSound.play();
//         board.position(game.fen());

//         if (recordPosition()) {
//             showGameResultModal(null, 'Draw by threefold repetition');
//             socket.emit('game_over', 'draw');
//             return false;
//         }

//         if (timerinstance) {
//             timerinstance.pause();
//             if (opponentTimerInstance) {
//                 opponentTimerInstance.start();
//             }
//         }

//         socket.emit('sync_state', {
//         fen: game.fen(),
//         turn: game.turn(),
//         whiteTime: document.getElementById('player-clock').textContent,
//         blackTime: document.getElementById('opponent-clock').textContent,
//         pgn: game.pgn(),
//         move: {
//             from: pendingPromotion.source,
//             to: pendingPromotion.target,
//             promotion: promotionPiece
//         }
//     });

//         moveHistory.push(game.fen());
//         currentMoveIndex = moveHistory.length - 1;
//         updatePGNDisplay();
//         updateStatus();

//         pendingPromotion = null;
//     }

//     function onDrop(source, target) {
//         removeHighlights();

//         if (
//             (game.turn() === 'w' && source.charAt(1) === '7' && target.charAt(1) === '8') ||
//             (game.turn() === 'b' && source.charAt(1) === '2' && target.charAt(1) === '1')
//         ) {
//             pendingPromotion = { source, target };
//             showPromotionModal(game.turn());
//             return;
//         }

//         const move = game.move({
//             from: source,
//             to: target
//         });

//         if (move === null) return 'snapback';

//         if (move.flags.includes('c')) {
//             captureSound.play();
//         } else if (move.flags.includes('k') || move.flags.includes('q')) {
//             castleSound.play();
//         } else if (game.in_check()) {
//             checkSound.play();
//         } else {
//             moveSound.play();
//         }

//         if (recordPosition()) {
//             showGameResultModal(null, 'Draw by threefold repetition');
//             socket.emit('game_over', 'draw');
//             return false;
//         }

//         if (timerinstance) {
//             timerinstance.pause();
//             if (opponentTimerInstance) {
//                 opponentTimerInstance.start();
//             }
//         }

//         // socket.emit('sync_state', {
//         //     fen: game.fen(),
//         //     turn: game.turn(),
//         //     whiteTime: document.getElementById('player-clock').textContent,
//         //     blackTime: document.getElementById('opponent-clock').textContent
//         // });
//         socket.emit('sync_state', {
//   fen: game.fen(),
//   turn: game.turn(),
//   whiteTime: document.getElementById('player-clock').textContent,
//   blackTime: document.getElementById('opponent-clock').textContent,
//   pgn: game.pgn() // Add this line
// });


//         moveHistory.push(game.fen());
//         currentMoveIndex = moveHistory.length - 1;
//         updatePGNDisplay();
//         updateStatus();
//         return false;
//     }

//     function onSnapEnd() {
//         board.position(game.fen());
//     }

//     function updateStatus() {
//         let status = '';
//         const moveColor = game.turn() === 'b' ? 'Black' : 'White';

//         if (game.in_checkmate()) {
//             const winner = game.turn() === 'w' ? 'Black' : 'White';
//             const isWinner = (c_player === 'b' && winner === 'Black') || 
//                             (c_player === 'w' && winner === 'White');
//             showGameResultModal(isWinner, 'Checkmate!');
//             socket.emit('game_over', winner);
//             endSound.play();
//             status = 'Game over, ' + moveColor + ' is in checkmate.';
//         } else if (game.in_draw()) {
//             status = 'Game over, drawn position.';
//             showGameResultModal(null, 'Game ended in a draw.');
//             endSound.play();
//         } else {
//             status = moveColor + ' to move';
//             if (game.in_check()) {
//                 status += ', ' + moveColor + ' is in check.';
//                 highlightKingInCheck();
//             }
//         }

//         if ($status.length) $status.html(status);
//         updatePGNDisplay();
//     }

// //     function updatePGNDisplay() {
// //   const pgn = game.pgn();
// //   const cleanPgn = pgn.replace(/[SetUp "1"]\s*[FEN "[^"]+"]\s*/g, '');
// //   document.getElementById('pgn-display').textContent = cleanPgn || 'PGN will appear here';
// // }
// function updatePGNDisplay() {
//   let pgn = game.pgn();
  
//   // Remove SetUp and FEN tags
//   pgn = pgn.replace(/\[SetUp "[^"]*"\]\s*/g, '')
//            .replace(/\[FEN "[^"]*"\]\s*/g, '');
  
//   // Format move numbers and moves
//   pgn = pgn.replace(/(\d+\.)(\s*\.\.\.)?\s*([^\s]+)/g, (match, number, ellipsis, move) => {
//     if (ellipsis) {
//       return `${number}... ${move} `;
//     }
//     return `${number} ${move} `;
//   });

//   // Split into lines for better readability
//   const moves = pgn.trim().split(/\s+/);
//   const formattedPgn = [];
//   for (let i = 0; i < moves.length; i += 3) {
//     const line = moves.slice(i, i + 3).join(' ');
//     if (line.trim()) {
//       formattedPgn.push(line);
//     }
//   }

//   const pgnDisplay = document.getElementById('pgn-display');
//   pgnDisplay.innerHTML = formattedPgn.join('<br>') || 'Game moves will appear here';
//   pgnDisplay.scrollTop = pgnDisplay.scrollHeight;
// }

//     function formatTime(seconds) {
//         const minutes = Math.floor(seconds / 60);
//         const remainingSeconds = seconds % 60;
//         return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//     }

//     function startTimer(seconds, elementId, isOpponent, onComplete) {
//         let timeLeft = parseInt(seconds);
//         console.log(timeLeft);
//         const element = document.getElementById(elementId);
//         element.textContent = formatTime(timeLeft);
//         if (isNaN(timeLeft)) {
//             console.error('Invalid time value:', seconds);
//             timeLeft = 600; // Default to 10 minutes if invalid
//         }
//         const timer = {
//             interval: null,
//             paused: true,
            
//             start: function() {
//                 if (!this.paused) return;
//                 this.paused = false;
//                 element.parentElement.classList.add('active');
//                 this.interval = setInterval(() => {
                    
//                     if (timeLeft <= 0) {
//                         this.stop();
//                         if (onComplete) onComplete();
//                         return ;
//                     }
//                     timeLeft--;
//                     element.textContent = formatTime(timeLeft);
//                 }, 1000);
//             },
            
//             pause: function() {
//                 if (this.paused) return;
//                 this.paused = true;
//                 element.parentElement.classList.remove('active');
//                 clearInterval(this.interval);
//             },
            
//             stop: function() {
//                 this.pause();
//                 timeLeft = 0;
//                 element.textContent = '0:00';
//             },
            
//             getTimeLeft: function() {
//                 return timeLeft;
//             },
//             setTime: function(newTime) {
//                 timeLeft = parseInt(newTime);
//                 if (isNaN(timeLeft)) {
//                     console.error('Invalid time value in setTime:', newTime);
//                     timeLeft = 600; // Default to 10 minutes if invalid
//                 }
//                 element.textContent = formatTime(timeLeft);
//             }
//         };

//         return timer;
//     }

//     function highlightKingInCheck() {
//         const turn = game.turn();
//         const kingSquare = $(`#Board1 .square-${game.fen().split(' ')[0].match(new RegExp(`[${turn}K]`, 'g'))[0]}`);
//         kingSquare.addClass('check');
//     }

//     board = Chessboard('Board1', {
//         draggable: true,
//         position: 'start',
//         onDragStart: onDragStart,
//         onDrop: onDrop,
//         onSnapEnd: onSnapEnd
//     });

    

//     socket.on('totalplayers', function(data) {
//         $('#total_players').html('Total Players: ' + data);
//     });

//     const chatBox = document.getElementById('chat-container');
//     chatBox.style.display = 'none';
//     const board1 = document.getElementById('Board1');

//     socket.on('match_made', (data) => {
//         if (isWaitingForMatch) {
//             isWaitingForMatch = false;
//             c_player = data.color;
//             positionHistory = [];
//             console.log('Match data received:', data);
//             const playerNameElement = document.getElementById('player-name');
//             const opponentNameElement = document.getElementById('opponent-name');
//             if (playerNameElement && opponentNameElement) {
//                 playerNameElement.textContent = data.playerName || 'Player';
//                 opponentNameElement.textContent = data.opponentName || 'Opponent';
//             }
//             document.getElementById('player-name').textContent = data.playerName;
//             document.getElementById('opponent-name').textContent = data.opponentName;
//             startSound.play();
//             $('#main-element').show();
//             $('#waiting_text').hide();
//             $('.welcome-screen').hide();
//             $('.theme-selector').show();
//             $('.player-clocks').show();
//             const gameBoardSection = document.querySelector('.game-board-section');
//             gameBoardSection.style.display = 'block';
//             gameBoardSection.classList.add('visible');
//             $('.game-board-section').css({
//                 'visibility': 'visible',
//                 'opacity': '1',
//                 'display': 'block'
//             });
//             const currentplayer = data.color === 'b' ? 'Black' : 'White';
//             $('#buttonsparent').html(`Playing as ${currentplayer}`);
//             alert('Match made! You are playing as ' + currentplayer + '.');
//             document.body.style.backgroundImage = 'none';
//             chatBox.style.display = 'block';
//             board1.style.display = 'block';
//             document.querySelector('.pgn-container').style.display = 'block';

//             game.reset();
//             board.clear();
//             board.start();
//             board.orientation(currentplayer.toLowerCase());
//             currentmatchtime = data.time;
//             moveHistory = [];
//             currentMoveIndex = -1;
//             updatePGNDisplay();

//             const timeInSeconds = parseInt(data.time) * 60;
//             timerinstance = startTimer(timeInSeconds, 'player-clock', false, () => {
//                 showGameResultModal(false, "Time's up!");
//                 socket.emit('game_over', data.color === 'w' ? 'Black' : 'White');
//             });
            
//             opponentTimerInstance = startTimer(timeInSeconds, 'opponent-clock', true, () => {
//                 showGameResultModal(true, "Opponent's time is up!");
//                 socket.emit('game_over', data.color === 'w' ? 'White' : 'Black');
//             });

//             if (game.turn() === c_player) {
//                 timerinstance.start();
//             } else {
//                 opponentTimerInstance.start();
//             }
//             const boardSquares = document.querySelectorAll('.square-55d63');
//             boardSquares.forEach(square => {
//                 square.style.transition = 'background 0.3s ease';
//             });
//         }
//     });

//     socket.on('sync_state_from_server', function(data) {
//         game.load(data.fen);
//         board.position(data.fen);
//         moveHistory.push(data.fen);
//         if (data.pgn) {
//     // Load the PGN into the game object
//     game.load_pgn(data.pgn);
//   }
//   updatePGNDisplay();
//         currentMoveIndex = moveHistory.length - 1;
//         updateStatus();
//         const whiteTime = parseInt(data.whiteTime);
//         const blackTime = parseInt(data.blackTime);
//         if (game.turn() === c_player) {
//             if (timerinstance) timerinstance.start();
//             if (opponentTimerInstance) opponentTimerInstance.pause();
//         } else {
//             if (timerinstance) timerinstance.pause();
//             if (opponentTimerInstance) opponentTimerInstance.start();
//         }

//         // if (c_player === 'w') {
//         //     document.getElementById('player-clock').textContent = data.whiteTime;
//         //     document.getElementById('opponent-clock').textContent = data.blackTime;
//         // } else {
//         //     document.getElementById('player-clock').textContent = data.blackTime;
//         //     document.getElementById('opponent-clock').textContent = data.whiteTime;
//         // }
//         if (c_player === 'w') {
//             timerInstance.setTime(parseInt(whiteTime));
//             opponentTimerInstance.setTime(parseInt(data.blackTime));
//         } else {
//             timerInstance.setTime(parseInt(blackTime));
//             opponentTimerInstance.setTime(parseInt(data.whiteTime));
//         }
//     });

   

//     socket.on('game_over_from_server', function(reason) {
//         if (reason === 'disconnection') {
//             showGameResultModal(true, 'Opponent disconnected. You win!');
//             isWinner=false;
//         } else if (reason === 'draw') {
//             showGameResultModal(null, 'Game ended in a draw.');
//         } else {
//             const isWinner = (c_player === 'w' && reason === 'White') ||
//                            (c_player === 'b' && reason === 'Black');
//             showGameResultModal(isWinner);
//         }
//         endSound.play();
//     });

//     function startMatchWaiting() {
//         setTimeout(() => {
//             count++;
//             console.log('Count:', count);
//             if (isWaitingForMatch) {
//                 isWaitingForMatch = false;
//                 alert('No match found. Please try again.');
//                 $('.welcome-screen').show();
//                 $('#waiting_text').hide();
//                 $('#main-element').show();
//             }
//         }, 30000);
//     }

//     // function handleButtonClick(event) {
//     //     if (isWaitingForMatch) {
//     //         console.log('Already waiting for a match');
//     //         return;
//     //     }
//     //     socket.emit('register_name', playerName);
//     //     const timer = event.target.getAttribute('data-time');
//     //     console.log('Requesting match with timer:', timer);
//     //     console.log('Time selected:', timer); // Debug log
//     //     console.log('Player name:', playerName); // Debug log
//     //     socket.emit('want_to_play', {timer,playerName});
//     //     isWaitingForMatch = true;
//     //     $('#main-element').hide();
//     //     displayRandomQuote();
//     //     $('#waiting_text').show();

//     //     startMatchWaiting();
//     // }
//     function handleButtonClick(event) {
//     if (isWaitingForMatch) {
//         console.log('Already waiting for a match');
//         return;
//     }
//     socket.emit('register_name', playerName);
//     const timer = parseInt(event.target.getAttribute('data-time'));
//     console.log('Requesting match with timer:', timer);
//     console.log('Time selected:', timer);
//     console.log('Player name:', playerName);
    
//     // Fix: Send data as a single object
//     socket.emit('want_to_play', {
//         timer: timer,
//         playerName: playerName
//     });
    
//     isWaitingForMatch = true;
//     $('#main-element').hide();
//     displayRandomQuote();
//     $('#waiting_text').show();

//     startMatchWaiting();
// }

//     document.addEventListener('DOMContentLoaded', () => {
//         const themeOptions = document.querySelectorAll('.theme-option');
//         const boardContainer = document.getElementById('Board1');

//         function setTheme(theme) {
//             boardContainer.classList.remove('board-theme-wooden', 'board-theme-emerald', 'board-theme-midnight', 
//                 'board-theme-royal', 'board-theme-neon', 'board-theme-sunset', 
//                 'board-theme-ocean', 'board-theme-classic', 'board-theme-forest', 'board-theme-crystal');
//             boardContainer.classList.add(`board-theme-${theme}`);
//             themeOptions.forEach(option => {
//                 option.classList.toggle('active', option.dataset.theme === theme);
//             });
//             localStorage.setItem('chessTheme', theme);
//         }

//         const savedTheme = localStorage.getItem('chessTheme') || 'wooden';
//         setTheme(savedTheme);

//         themeOptions.forEach(option => {
//             option.addEventListener('click', () => {
//                 const theme = option.dataset.theme;
//                 setTheme(theme);
//                 if (board) {
//                     board.position(game.fen());
//                 }
//             });

//             option.addEventListener('mouseover', (e) => {
//                 const tooltip = document.createElement('div');
//                 tooltip.className = 'theme-tooltip';
//                 tooltip.textContent = option.title;
//                 tooltip.style.position = 'absolute';
//                 tooltip.style.left = `${e.pageX + 10}px`;
//                 tooltip.style.top = `${e.pageY + 10}px`;
//                 tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
//                 tooltip.style.color = 'white';
//                 tooltip.style.padding = '5px 10px';
//                 tooltip.style.borderRadius = '4px';
//                 tooltip.style.zIndex = '1000';
//                 document.body.appendChild(tooltip);
//                 option.addEventListener('mouseout', () => tooltip.remove());
//             });
//         });

//         const buttons = document.getElementsByClassName('timer-button');
//         for (let i = 0; i < buttons.length; i++) {
//             buttons[i].addEventListener('click', handleButtonClick);
//         }

//         const chatInput = document.getElementById('chat-input');
//         const sendButton = document.getElementById('send-button');
//         const chatBox = document.getElementById('chat-box');

//         sendButton.addEventListener('click', () => {
//             const message = chatInput.value.trim();
//             socket.emit('send_message', message);
//             displayMessage('You', message);
//             chatInput.value = '';
//         });

//         chatInput.addEventListener('keypress', (event) => {
//             if (event.key === 'Enter') {
//                 sendButton.click();
//             }
//         });

//         socket.on('receive_message', (data) => {
//             displayMessage(data.sender, data.text);
//         });

//         function displayMessage(sender, message) {
//             // const messageElement = document.createElement('div');
//             // messageElement.textContent = `${sender}: ${message}`;
//             // chatBox.appendChild(messageElement);
//             // chatBox.scrollTop = chatBox.scrollHeight;
//             const messageElement = document.createElement('div');
//         messageElement.className = 'chat-message';
//         messageElement.textContent = `${sender}: ${message}`;
//         chatBox.appendChild(messageElement);
//         chatBox.scrollTop = chatBox.scrollHeight;
//         }

       
//         document.getElementById('resign').addEventListener('click', () => {
//             if (confirm('Are you sure you want to resign?')) {
//                 const winner = c_player === 'w' ? 'Black' : 'White';
//                 socket.emit('game_over', winner);
//                 showGameResultModal(false, 'You resigned the game.');
//                 endSound.play();
//             }
//         });

//         document.getElementById('first-move').addEventListener('click', () => {
//             if (currentMoveIndex > -1) {
//                 game.reset();
//                 board.position('start');
//                 currentMoveIndex = -1;
//                 updatePGNDisplay();
//             }
//         });

//         document.getElementById('last-move').addEventListener('click', () => {
//             if (currentMoveIndex < moveHistory.length - 1) {
//                 while (currentMoveIndex < moveHistory.length - 1) {
//                     currentMoveIndex++;
//                     game.load(moveHistory[currentMoveIndex]);
//                 }
//                 board.position(game.fen());
//                 updatePGNDisplay();
//             }
//         });

//         document.getElementById('prev-move').addEventListener('click', () => {
//             if (currentMoveIndex > -1) {
//                 currentMoveIndex--;
//                 if (currentMoveIndex === -1) {
//                     game.reset();
//                     board.position('start');
//                 } else {
//                     game.load(moveHistory[currentMoveIndex]);
//                     board.position(game.fen());
//                 }
//                 updatePGNDisplay();
//             }
//         });

//         document.getElementById('next-move').addEventListener('click', () => {
//             if (currentMoveIndex < moveHistory.length - 1) {
//                 currentMoveIndex++;
//                 game.load(moveHistory[currentMoveIndex]);
//                 board.position(game.fen());
//                 updatePGNDisplay();
//             }
//         });

//         document.getElementById('copy-pgn').addEventListener('click', () => {
//             const cleanPgn = game.pgn().replace(/\[SetUp "1"\]\s*\[FEN "[^"]+"\]\s*/g, '');
//             navigator.clipboard.writeText(cleanPgn);
//             alert('PGN copied to clipboard!');
//         });
//     });
const socket = io("https://chess-game-backend-z158.onrender.com");
var board = null;
var count = 0;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
let c_player = null;
let timerinstance = null;
let opponentTimerInstance = null;
let currentmatchtime = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isWaitingForMatch = false;
let positionHistory = [];
let pendingPromotion = null;
let playerName = '';
const userData = localStorage.getItem('chessmaster_user');
const user = JSON.parse(userData);
playerName = user.username;
socket.emit('register_name', playerName);

// Sounds
const moveSound = new Audio('./sounds/move.mp3');
const captureSound = new Audio('./sounds/capture.mp3');
const checkSound = new Audio('./sounds/check.mp3');
const castleSound = new Audio('./sounds/castle.mp3');
const startSound = new Audio('./sounds/start.mp3');
const endSound = new Audio('./sounds/end.mp3');

function recordPosition() {
    const position = game.fen().split(' ').slice(0, 4).join(' ');
    positionHistory.push(position);
    return checkThreefoldRepetition(position);
}

function checkThreefoldRepetition(position) {
    return positionHistory.filter(pos => pos === position).length === 2;
}

function showGameResultModal(isWinner, reason = '') {
    const modal = document.getElementById('game-result-modal');
    const title = document.getElementById('result-title');
    const icon = document.getElementById('result-icon');
    const message = document.getElementById('result-message');

    let resultType = '';
    if (isWinner === null) {
        title.textContent = 'Draw';
        icon.innerHTML = '🤝';
        message.textContent = reason || 'The game is a draw!';
        resultType = 'draw';
    } else if (isWinner) {
        title.textContent = 'Victory!';
        icon.innerHTML = '👑';
        message.textContent = reason ? `You won! ${reason}` : 'Congratulations! You have won the game!';
        resultType = 'win';
    } else {
        title.textContent = 'Defeat';
        icon.innerHTML = '💔';
        message.textContent = reason ? `You lost. ${reason}` : 'Better luck next time!';
        resultType = 'loss';
    }

    modal.style.display = 'flex';
    endSound.play();

    socket.emit('update_game_result', {
        playerName: playerName,
        color: c_player,
        result: resultType,
        timeControl: currentmatchtime,
        reason: reason
    });

    document.querySelector('.modal-close').onclick = () => {
        modal.style.display = 'none';
        window.location.reload();
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            window.location.reload();
        }
    };
}

import { quotes } from './chess_quotes.js';
function displayRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const [quote, author] = quotes[randomIndex];
    document.getElementById("waiting_text").innerHTML = `Waiting for Opponent...<br><br>"${quote}"<br><span style="font-weight: bold;">-- ${author}</span>`;
}

function removeHighlights() {
    $('#Board1 .square-55d63').removeClass('highlight check');
    $('#Board1 .square-55d63').find('.legal-dot').remove();
}

function highlightSquare(square) {
    const $square = $('#Board1 .square-' + square);
    if ($square.find('.legal-dot').length === 0) {
        $square.append('<div class="legal-dot"></div>');
    }
}

function showLegalMoves(piece, source) {
    const moves = game.moves({ square: source, verbose: true });
    moves.forEach(move => highlightSquare(move.to));
}

function onDragStart(source, piece, position, orientation) {
    if (game.turn() !== c_player) return false;
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    removeHighlights();
    showLegalMoves(piece, source);
}

function showPromotionModal(color) {
    const modal = document.querySelector('.promotion-modal');
    const pieces = modal.querySelectorAll('.promotion-piece');
    pieces.forEach(piece => {
        const currentSrc = piece.src;
        piece.src = currentSrc.replace(/[wb](?=[qrbn])/, color);
    });
    modal.style.display = 'flex';
    pieces.forEach(piece => piece.onclick = () => handlePromotion(piece.dataset.piece));
}

function handlePromotion(promotionPiece) {
    const modal = document.querySelector('.promotion-modal');
    modal.style.display = 'none';
    if (!pendingPromotion) return;

    const move = game.move({
        from: pendingPromotion.source,
        to: pendingPromotion.target,
        promotion: promotionPiece
    });

    if (move === null) return 'snapback';

    captureSound.play();
    board.position(game.fen());

    if (recordPosition()) {
        showGameResultModal(null, 'Draw by threefold repetition');
        socket.emit('update_game_result', {
            playerName: playerName,
            color: c_player,
            result: 'draw',
            timeControl: currentmatchtime,
            reason: 'Draw by threefold repetition'
        });
        return false;
    }

    if (timerinstance) {
        timerinstance.pause();
        if (opponentTimerInstance) opponentTimerInstance.start();
    }

    socket.emit('sync_state', {
        fen: game.fen(),
        turn: game.turn(),
        whiteTime: document.getElementById('player-clock').textContent,
        blackTime: document.getElementById('opponent-clock').textContent,
        pgn: game.pgn(),
        move: { from: pendingPromotion.source, to: pendingPromotion.target, promotion: promotionPiece }
    });

    moveHistory.push(game.fen());
    currentMoveIndex = moveHistory.length - 1;
    updatePGNDisplay();
    updateStatus();
    pendingPromotion = null;
}

function onDrop(source, target) {
    removeHighlights();

    if ((game.turn() === 'w' && source.charAt(1) === '7' && target.charAt(1) === '8') ||
        (game.turn() === 'b' && source.charAt(1) === '2' && target.charAt(1) === '1')) {
        pendingPromotion = { source, target };
        showPromotionModal(game.turn());
        return;
    }

    const move = game.move({ from: source, to: target });
    if (move === null) return 'snapback';

    if (move.flags.includes('c')) captureSound.play();
    else if (move.flags.includes('k') || move.flags.includes('q')) castleSound.play();
    else if (game.in_check()) checkSound.play();
    else moveSound.play();

    if (recordPosition()) {
        showGameResultModal(null, 'Draw by threefold repetition');
        socket.emit('update_game_result', {
            playerName: playerName,
            color: c_player,
            result: 'draw',
            timeControl: currentmatchtime,
            reason: 'Draw by threefold repetition'
        });
        return false;
    }

    if (timerinstance) {
        timerinstance.pause();
        if (opponentTimerInstance) opponentTimerInstance.start();
    }

    socket.emit('sync_state', {
        fen: game.fen(),
        turn: game.turn(),
        whiteTime: document.getElementById('player-clock').textContent,
        blackTime: document.getElementById('opponent-clock').textContent,
        pgn: game.pgn()
    });

    moveHistory.push(game.fen());
    currentMoveIndex = moveHistory.length - 1;
    updatePGNDisplay();
    updateStatus();
    return false;
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';
    const moveColor = game.turn() === 'b' ? 'Black' : 'White';

    if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        const isWinner = (c_player === 'b' && winner === 'Black') || 
                         (c_player === 'w' && winner === 'White');
        showGameResultModal(isWinner, 'Checkmate!');
        socket.emit('update_game_result', {
            playerName: playerName,
            color: c_player,
            result: isWinner ? 'win' : 'loss',
            timeControl: currentmatchtime,
            reason: 'Checkmate'
        });
    } else if (game.in_draw()) {
        status = 'Game over, drawn position.';
        showGameResultModal(null, 'Game ended in a draw.');
        socket.emit('update_game_result', {
            playerName: playerName,
            color: c_player,
            result: 'draw',
            timeControl: currentmatchtime,
            reason: 'Draw'
        });
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check.';
            highlightKingInCheck();
        }
    }

    if ($status.length) $status.html(status);
    updatePGNDisplay();
}

function updatePGNDisplay() {
    let pgn = game.pgn();
    pgn = pgn.replace(/\[SetUp "[^"]*"\]\s*/g, '').replace(/\[FEN "[^"]*"\]\s*/g, '');
    pgn = pgn.replace(/(\d+\.)(\s*\.\.\.)?\s*([^\s]+)/g, (match, number, ellipsis, move) => {
        if (ellipsis) return `${number}... ${move} `;
        return `${number} ${move} `;
    });
    const moves = pgn.trim().split(/\s+/);
    const formattedPgn = [];
    for (let i = 0; i < moves.length; i += 3) {
        const line = moves.slice(i, i + 3).join(' ');
        if (line.trim()) formattedPgn.push(line);
    }
    const pgnDisplay = document.getElementById('pgn-display');
    pgnDisplay.innerHTML = formattedPgn.join('<br>') || 'Game moves will appear here';
    pgnDisplay.scrollTop = pgnDisplay.scrollHeight;
}

function parseTimeToSeconds(timeStr) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return (minutes * 60) + seconds;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer(seconds, elementId, isOpponent, onComplete) {
    let timeLeft = parseInt(seconds);
    const element = document.getElementById(elementId);
    element.textContent = formatTime(timeLeft);
    if (isNaN(timeLeft)) {
        console.error('Invalid time value:', seconds);
        timeLeft = 600;
    }
    const timer = {
        interval: null,
        paused: true,
        start: function() {
            if (!this.paused) return;
            this.paused = false;
            element.parentElement.classList.add('active');
            this.interval = setInterval(() => {
                if (timeLeft <= 0) {
                    this.stop();
                    if (onComplete) onComplete();
                    return;
                }
                timeLeft--;
                element.textContent = formatTime(timeLeft);
            }, 1000);
        },
        pause: function() {
            if (this.paused) return;
            this.paused = true;
            element.parentElement.classList.remove('active');
            clearInterval(this.interval);
        },
        stop: function() {
            this.pause();
            timeLeft = 0;
            element.textContent = '0:00';
        },
        getTimeLeft: function() {
            return timeLeft;
        },
        setTime: function(newTime) {
            if (typeof newTime === 'string') {
                timeLeft = parseTimeToSeconds(newTime);
            } else {
                timeLeft = parseInt(newTime);
            }
            if (isNaN(timeLeft)) {
                console.error('Invalid time value in setTime:', newTime);
                timeLeft = 600;
            }
            element.textContent = formatTime(timeLeft);
        }
    };
    return timer;
}

function highlightKingInCheck() {
    const turn = game.turn();
    const kingSquare = $(`#Board1 .square-${game.fen().split(' ')[0].match(new RegExp(`[${turn}K]`, 'g'))[0]}`);
    kingSquare.addClass('check');
}

board = Chessboard('Board1', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
});

socket.on('totalplayers', function(data) {
    $('#total_players').html('Total Players: ' + data);
});

const chatBox = document.getElementById('chat-container');
chatBox.style.display = 'none';
const board1 = document.getElementById('Board1');

socket.on('match_made', (data) => {
    if (isWaitingForMatch) {
        isWaitingForMatch = false;
        c_player = data.color;
        positionHistory = [];
        document.getElementById('player-name').textContent = data.playerName;
        document.getElementById('opponent-name').textContent = data.opponentName;
        startSound.play();
        $('#main-element').show();
        $('#waiting_text').hide();
        $('.welcome-screen').hide();
        $('.theme-selector').show();
        $('.player-clocks').show();
        const gameBoardSection = document.querySelector('.game-board-section');
        gameBoardSection.style.display = 'block';
        gameBoardSection.classList.add('visible');
        $('.game-board-section').css({ 'visibility': 'visible', 'opacity': '1', 'display': 'block' });
        const currentplayer = data.color === 'b' ? 'Black' : 'White';
        $('#buttonsparent').html(`Playing as ${currentplayer}`);
        alert('Match made! You are playing as ' + currentplayer + '.');
        document.body.style.backgroundImage = 'none';
        chatBox.style.display = 'block';
        board1.style.display = 'block';
        document.querySelector('.pgn-container').style.display = 'block';

        game.reset();
        board.clear();
        board.start();
        board.orientation(currentplayer.toLowerCase());
        currentmatchtime = data.time;
        moveHistory = [];
        currentMoveIndex = -1;
        updatePGNDisplay();

        const timeInSeconds = parseInt(data.time) * 60;
        timerinstance = startTimer(timeInSeconds, 'player-clock', false, () => {
            showGameResultModal(false, "Time's up!");
            socket.emit('update_game_result', {
                playerName: playerName,
                color: c_player,
                result: 'loss',
                timeControl: currentmatchtime,
                reason: "Time's up"
            });
        });
        
        opponentTimerInstance = startTimer(timeInSeconds, 'opponent-clock', true, () => {
            showGameResultModal(true, "Opponent's time is up!");
            socket.emit('update_game_result', {
                playerName: playerName,
                color: c_player,
                result: 'win',
                timeControl: currentmatchtime,
                reason: "Opponent's time is up"
            });
        });

        if (game.turn() === c_player) timerinstance.start();
        else opponentTimerInstance.start();

        const boardSquares = document.querySelectorAll('.square-55d63');
        boardSquares.forEach(square => square.style.transition = 'background 0.3s ease');
    }
});

socket.on('sync_state_from_server', function(data) {
    game.load(data.fen);
    board.position(data.fen);
    moveHistory.push(data.fen);
    if (data.pgn) game.load_pgn(data.pgn);
    updatePGNDisplay();
    currentMoveIndex = moveHistory.length - 1;
    updateStatus();

    if (game.turn() === c_player) {
        if (timerinstance) timerinstance.start();
        if (opponentTimerInstance) opponentTimerInstance.pause();
    } else {
        if (timerinstance) timerinstance.pause();
        if (opponentTimerInstance) opponentTimerInstance.start();
    }

    if (c_player === 'w') {
        timerinstance.setTime(data.whiteTime);
        opponentTimerInstance.setTime(data.blackTime);
    } else {
        timerinstance.setTime(data.blackTime);
        opponentTimerInstance.setTime(data.whiteTime);
    }
});

socket.on('game_over_from_server', function(data) {
    if (typeof data === 'string') {
        if (data === 'disconnection') {
            showGameResultModal(true, 'Opponent disconnected. You win!');
        } else if (data === 'draw') {
            showGameResultModal(null, 'Game ended in a draw.');
        }
    } else {
        const isWinner = (c_player === 'w' && data.winner === 'White') ||
                        (c_player === 'b' && data.winner === 'Black');
        showGameResultModal(isWinner, data.reason || '');
    }
    endSound.play();
});

function startMatchWaiting() {
    setTimeout(() => {
        count++;
        if (isWaitingForMatch) {
            isWaitingForMatch = false;
            alert('No match found. Please try again.');
            $('.welcome-screen').show();
            $('#waiting_text').hide();
            $('#main-element').show();
        }
    }, 30000);
}

function handleButtonClick(event) {
    if (isWaitingForMatch) {
        console.log('Already waiting for a match');
        return;
    }
    socket.emit('register_name', playerName);
    const timer = parseInt(event.target.getAttribute('data-time'));
    socket.emit('want_to_play', { timer: timer, playerName: playerName });
    isWaitingForMatch = true;
    $('#main-element').hide();
    displayRandomQuote();
    $('#waiting_text').show();
    startMatchWaiting();
}

document.addEventListener('DOMContentLoaded', () => {
    const themeOptions = document.querySelectorAll('.theme-option');
    const boardContainer = document.getElementById('Board1');

    function setTheme(theme) {
        boardContainer.classList.remove('board-theme-wooden', 'board-theme-emerald', 'board-theme-midnight', 
            'board-theme-royal', 'board-theme-neon', 'board-theme-sunset', 
            'board-theme-ocean', 'board-theme-classic', 'board-theme-forest', 'board-theme-crystal');
        boardContainer.classList.add(`board-theme-${theme}`);
        themeOptions.forEach(option => option.classList.toggle('active', option.dataset.theme === theme));
        localStorage.setItem('chessTheme', theme);
    }

    const savedTheme = localStorage.getItem('chessTheme') || 'wooden';
    setTheme(savedTheme);

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
            if (board) board.position(game.fen());
        });

        option.addEventListener('mouseover', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'theme-tooltip';
            tooltip.textContent = option.title;
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY + 10}px`;
            tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.zIndex = '1000';
            document.body.appendChild(tooltip);
            option.addEventListener('mouseout', () => tooltip.remove());
        });
    });

    const buttons = document.getElementsByClassName('timer-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', handleButtonClick);
    }

    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatBox = document.getElementById('chat-box');

    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        socket.emit('send_message', message);
        displayMessage('You', message);
        chatInput.value = '';
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendButton.click();
    });

    socket.on('receive_message', (data) => displayMessage(data.sender, data.text));

    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.textContent = `${sender}: ${message}`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    document.getElementById('resign').addEventListener('click', () => {
        if (confirm('Are you sure you want to resign?')) {
            socket.emit('update_game_result', {
                playerName: playerName,
                color: c_player,
                result: 'loss',
                timeControl: currentmatchtime,
                reason: 'Resignation'
            });
            showGameResultModal(false, 'You resigned the game.');
            endSound.play();
        }
    });

    document.getElementById('first-move').addEventListener('click', () => {
        if (currentMoveIndex > -1) {
            game.reset();
            board.position('start');
            currentMoveIndex = -1;
            updatePGNDisplay();
        }
    });

    document.getElementById('last-move').addEventListener('click', () => {
        if (currentMoveIndex < moveHistory.length - 1) {
            while (currentMoveIndex < moveHistory.length - 1) {
                currentMoveIndex++;
                game.load(moveHistory[currentMoveIndex]);
            }
            board.position(game.fen());
            updatePGNDisplay();
        }
    });

    document.getElementById('prev-move').addEventListener('click', () => {
        if (currentMoveIndex > -1) {
            currentMoveIndex--;
            if (currentMoveIndex === -1) game.reset();
            else game.load(moveHistory[currentMoveIndex]);
            board.position(game.fen());
            updatePGNDisplay();
        }
    });

    document.getElementById('next-move').addEventListener('click', () => {
        if (currentMoveIndex < moveHistory.length - 1) {
            currentMoveIndex++;
            game.load(moveHistory[currentMoveIndex]);
            board.position(game.fen());
            updatePGNDisplay();
        }
    });

    document.getElementById('copy-pgn').addEventListener('click', () => {
        const cleanPgn = game.pgn().replace(/\[SetUp "1"\]\s*\[FEN "[^"]+"\]\s*/g, '');
        navigator.clipboard.writeText(cleanPgn);
        alert('PGN copied to clipboard!');
    });
});