let selectedRating = 400; // Default rating

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

            // Reset forms when toggling
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
                
                const response = await fetch('https://chess-game-backend-z158.onrender.com/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                    
                });

                const data = await response.json();
                console.log(data);
                if (response.ok) {
                    // Store user data from the server response in localStorage
                    localStorage.setItem('chessmaster_user', JSON.stringify({
                        username: document.getElementById('loginUsername').value, // Use username from server
                        password: document.getElementById('loginPassword').value, // Use password from server
                        rating: data.rating,    // Use rating from server
                        userId: data.userId,
                        blitzrating: data.blitzRating,
                        bulletrating: data.bulletRating,
                        rapidrating: data.rapidRating,
                        token: data.token
                    }));
                    
                    showMessage('Login successful! Redirecting...', true);
                    event.target.reset();
                    
                    // Redirect to dashboard or game page
                    setTimeout(() => window.location.href = '/index.html', 1500);
                } else {
                    showMessage(data.message || 'Login failed', false);
                }
            } catch (error) {
                showMessage('An error occurred during login. Please try again.', false);
            }
        }

        async function handleSignup(event) {
            event.preventDefault();
            
            try {
                const username = document.getElementById('signupUsername').value;
                const password = document.getElementById('signupPassword').value;
                const rating = selectedRating;
                
                const response = await fetch('https://chess-game-backend-z158.onrender.com/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password, rating })
                });

                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Signup successful! Please login to continue.', true);
                    event.target.reset();
                    
                    // Reset rating selection
                    const ratingButtons = document.querySelectorAll('.rating-btn');
                    ratingButtons.forEach(btn => btn.classList.remove('selected'));
                    ratingButtons[0].classList.add('selected');
                    selectedRating = 400;
                    document.getElementById('selectedRating').value = '400';
                    
                    // Switch to login form
                    toggleForm();
                } else {
                    showMessage(data.message || 'Signup failed', false);
                }
            } catch (error) {
                showMessage('An error occurred during signup. Please try again.', false);
            }
        }

        // Initialize the first rating button as selected
        document.addEventListener('DOMContentLoaded', () => {
            const firstRatingButton = document.querySelector('.rating-btn');
            if (firstRatingButton) {
                firstRatingButton.classList.add('selected');
            }
        });

        // Utility functions for user session management
        function isLoggedIn() {
            const userData = localStorage.getItem('chessmaster_user');
            return userData !== null;
        }

        function logout() {
            localStorage.removeItem('chessmaster_user');
            showMessage('Logged out successfully', true);
            // Redirect to login page if needed
            // window.location.href = '/index.html';
        }

        function getCurrentUser() {
            const userData = localStorage.getItem('chessmaster_user');
            console.log(userData);
            return userData ? JSON.parse(userData) : null;
        }
        // function getCurrentUser() {
        //     try {
        //         const userData = localStorage.getItem('chessmaster_user');
        //         if (!userData) return null;
                
        //         const user = JSON.parse(userData);
        //         return {
        //             username: user.username,
        //             rating: user.rating,
        //             userId: user.userId,
        //             token: user.token
        //         };
        //     } catch (error) {
        //         console.error('Error parsing user data:', error);
        //         return null;
        //     }
        // }