  // Chess piece animation
  const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
  let currentPieceIndex = 0;
  const chessPieceElement = document.getElementById('chess-piece');
  
  function updateChessPiece() {
      chessPieceElement.textContent = chessPieces[currentPieceIndex];
      currentPieceIndex = (currentPieceIndex + 1) % chessPieces.length;
  }
  
  // Update chess piece every 3 seconds (balanced timing)
  updateChessPiece();
  setInterval(updateChessPiece, 3000);
  
  // Update current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
              target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
              });
          }
      });
  });