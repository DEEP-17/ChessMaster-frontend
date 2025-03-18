let selectedRating = 400; 
const baseURL = process.env.SERVER_URL;
function selectRating(rating, button) {
    const ratingButtons = document.querySelectorAll('.rating-btn');
    ratingButtons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    selectedRating = rating;
    document.getElementById('selectedRating').value = rating;
}
function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
    if (loginForm.style.display === 'block') {
        document.getElementById('loginForm').querySelector('form').reset();
    } else {
        document.getElementById('signupForm').querySelector('form').reset();
        const ratingButtons = document.querySelectorAll('.rating-btn');
        ratingButtons.forEach(btn => btn.classList.remove('selected'));
        ratingButtons[0].classList.add('selected');
        selectedRating = 400;
        document.getElementById('selectedRating').value = '400';
    }
}
function showMessage(message, isSuccess) {
    const notificationsContainer = document.getElementById('notificationsContainer');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSuccess ? 'success' : 'error'}`;
    messageElement.textContent = message;
    notificationsContainer.appendChild(messageElement);
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(100%)';
        messageElement.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            notificationsContainer.removeChild(messageElement);
        }, 300);
    }, 5000);
}
async function handleLogin(event) {
    event.preventDefault();
    try {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const response = await fetch(`${baseURL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        console.log('Login status:', response.status); 
        const data = await response.json();
        console.log('Login response:', data); 
        if (response.ok) {
            localStorage.setItem('chessmaster_user', JSON.stringify(data.user));
            showMessage('Login successful! Redirecting...', true);
            event.target.reset();
            setTimeout(() => window.location.href = '/index.html', 1500);
        } else {
            showMessage(data.message || 'Login failed', false);
        }
    } catch (error) {
        showMessage('An error occurred during login. Please try again.', false);
        console.error('Login error:', error);
    }
}
async function handleSignup(event) {
    event.preventDefault();
    try {
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const rating = selectedRating; 
        const response = await fetch(`${baseURL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, rating })
        });

        console.log('Signup status:', response.status); 
        const data = await response.json();
        console.log('Signup response:', data); 
        if (response.ok) {
            showMessage('Signup successful! Please login to continue.', true);
            event.target.reset();
            const ratingButtons = document.querySelectorAll('.rating-btn');
            ratingButtons.forEach(btn => btn.classList.remove('selected'));
            ratingButtons[0].classList.add('selected');
            selectedRating = 400;
            document.getElementById('selectedRating').value = '400';
            toggleForm();
        } else {
            showMessage(data.message || 'Signup failed', false);
        }
    } catch (error) {
        showMessage('An error occurred during signup. Please try again.', false);
        console.error('Signup error:', error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const firstRatingButton = document.querySelector('.rating-btn');
    if (firstRatingButton) {
        firstRatingButton.classList.add('selected');
    }
});
function isLoggedIn() {
    const userData = localStorage.getItem('chessmaster_user');
    return userData !== null;
}
function logout() {
    localStorage.removeItem('chessmaster_user');
    showMessage('Logged out successfully', true);
}
function getCurrentUser() {
    const userData = localStorage.getItem('chessmaster_user');
    console.log('Current user data:', userData);
    return userData ? JSON.parse(userData) : null;
}