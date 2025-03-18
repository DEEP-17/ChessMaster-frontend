function getCurrentUser() {
    try {
        const userData = localStorage.getItem('chessmaster_user');
        if (!userData) return null;
        
        return JSON.parse(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}
document.getElementById('playNowBtn').addEventListener('click', function(event) {
    event.preventDefault(); 
    const user = getCurrentUser();
    window.location.href = user ? 'game.html' : 'signin.html';
});
function updateAuthSection() {
    const user = getCurrentUser();
    const profileSection = document.getElementById('profile-section');
    if (user) {
        profileSection.innerHTML = `
            <button onclick="toggleDropdown()" class="profile-btn">
                ${user.username}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </button>
            <div id="profileDropdown" class="dropdown">
                <a href="/profile.html">Profile</a>
                <button onclick="handleLogout()">Logout</button>
            </div>
        `;
    } else {
        profileSection.innerHTML = `
            <button onclick="window.location.href='/signin.html'" class="sign-in-btn">
                Sign In
            </button>
        `;
    }
}
function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}
function handleLogout() {
    localStorage.removeItem('chessmaster_user');
    updateAuthSection();
}
document.addEventListener('click', (event) => {
    const profileSection = document.getElementById('profile-section');
    const dropdown = document.getElementById('profileDropdown');
    
    if (dropdown && !profileSection.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});
const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
let currentPieceIndex = 0;
const chessPieceElement = document.getElementById('chess-piece');
function updateChessPiece() {
    chessPieceElement.textContent = chessPieces[currentPieceIndex];
    currentPieceIndex = (currentPieceIndex + 1) % chessPieces.length;
}
updateChessPiece();
setInterval(updateChessPiece, 3000);
document.getElementById('current-year').textContent = new Date().getFullYear();
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
updateAuthSection();