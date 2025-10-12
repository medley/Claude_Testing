// ============================================================================
// EMILY'S MAGICAL SPELLING GAME - MAIN GAME LOGIC
// A comprehensive spelling game with Firebase authentication and progress tracking
// ============================================================================

// ============================================================================
// FIREBASE CONFIGURATION AND INITIALIZATION
// ============================================================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: 'AIzaSyAp3IIerN5CBwln1-PvfX_aDDufvQmhDyM',
    authDomain: 'kids-app-34d1b.firebaseapp.com',
    projectId: 'kids-app-34d1b',
    storageBucket: 'kids-app-34d1b.firebasestorage.app',
    messagingSenderId: '256010578689',
    appId: '1:256010578689:web:911644649303631b214900'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;
let userId = null;

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Helper function to show friendly auth messages
 */
function showAuthMessage(message, isError = false) {
    const msgDiv = document.getElementById('authMessage');
    msgDiv.style.display = 'block';
    msgDiv.style.background = isError
        ? 'linear-gradient(135deg, #ffcdd2, #ef9a9a)'
        : 'linear-gradient(135deg, #c8e6c9, #a5d6a7)';
    msgDiv.style.color = isError ? '#c62828' : '#2e7d32';
    msgDiv.innerHTML = message;
}

function hideAuthMessage() {
    document.getElementById('authMessage').style.display = 'none';
}

/**
 * Creates a new user account
 */
async function createAccount() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    hideAuthMessage();

    if (!email || !password) {
        showAuthMessage('📝 Please enter both email and password!', true);
        return;
    }

    if (password.length < 6) {
        showAuthMessage('🔒 Password needs to be at least 6 characters long! Make it strong and secure!', true);
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        userId = currentUser.uid;
        showAuthMessage('Account created successfully! Welcome to the spelling game!');
        setTimeout(() => showGameScreen(), 1500);
    } catch (error) {
        console.error('Signup error:', error);

        // Kid-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            showAuthMessage('💡 This email already has an account! Try logging in with the button above instead. 🔑', true);
        } else if (error.code === 'auth/invalid-email') {
            showAuthMessage('Hmm, that email doesn\'t look quite right. Can you check it again?', true);
        } else if (error.code === 'auth/weak-password') {
            showAuthMessage('🔒 Your password needs to be stronger! Try adding more letters or numbers.', true);
        } else {
            showAuthMessage('😊 Oops! Something went wrong. Please try again or ask a grown-up for help!', true);
        }
    }
}

/**
 * Signs in an existing user
 */
async function signIn() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    hideAuthMessage();

    if (!email || !password) {
        showAuthMessage('📝 Please enter both email and password!', true);
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        userId = currentUser.uid;

        showAuthMessage('Welcome back! Loading your spelling game...');

        // Check if teacher account
        if (email === 'teacher@emilygame.com') {
            setTimeout(() => openTeacherPortal(), 1000);
        } else {
            setTimeout(() => showGameScreen(), 1500);
        }
    } catch (error) {
        console.error('Login error:', error);

        // Kid-friendly error messages
        if (error.code === 'auth/user-not-found') {
            showAuthMessage('We couldn\'t find that account. Try creating a new account with the button below!', true);
        } else if (error.code === 'auth/wrong-password') {
            showAuthMessage('Oops! That password doesn\'t match. Try again or click "Forgot Password?" below for help.', true);
        } else if (error.code === 'auth/invalid-email') {
            showAuthMessage('Hmm, that email doesn\'t look quite right. Can you check it again?', true);
        } else if (error.code === 'auth/too-many-requests') {
            showAuthMessage('Too many tries! Please wait a few minutes and try again, or reset your password.', true);
        } else {
            showAuthMessage('😊 Oops! Something went wrong. Please try again or ask a grown-up for help!', true);
        }
    }
}

/**
 * Sends password reset email
 */
async function forgotPassword() {
    const email = document.getElementById('authEmail').value.trim();

    hideAuthMessage();

    if (!email) {
        showAuthMessage('📧 Please enter your email address first so we know where to send the reset link!', true);
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showAuthMessage('✉️ Password reset email sent! Check your inbox and follow the link to create a new password. 💌');
    } catch (error) {
        console.error('Password reset error:', error);

        // Kid-friendly error messages
        if (error.code === 'auth/user-not-found') {
            showAuthMessage('🔍 We couldn\'t find an account with that email. Try creating a new account instead!', true);
        } else if (error.code === 'auth/invalid-email') {
            showAuthMessage('Hmm, that email doesn\'t look quite right. Can you check it again?', true);
        } else {
            showAuthMessage('😊 Oops! We couldn\'t send the reset email. Please try again or ask a grown-up for help!', true);
        }
    }
}

/**
 * Logs out the current user
 */
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        userId = null;
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
    });
}

/**
 * Shows the game screen after successful authentication
 */
function showGameScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    // Show teacher portal button if teacher
    if (currentUser && currentUser.email === 'teacher@emilygame.com') {
        document.getElementById('teacherPortalBtn').style.display = 'block';
    }

    init();
    setupOnScreenKeyboard();
    setupTouchEvents();
}

// ============================================================================
// TEACHER PORTAL FUNCTIONS
// ============================================================================

/**
 * Checks if current user has teacher access
 */
function checkTeacherAccess() {
    if (currentUser && currentUser.email === 'teacher@emilygame.com') {
        openTeacherPortal();
    } else {
        alert('Teacher access only!');
    }
}

/**
 * Opens the teacher portal showing all students' progress
 */
async function openTeacherPortal() {
    try {
        const teacherContent = document.getElementById('teacherContent');
        teacherContent.innerHTML = '<p>Loading all students\' progress...</p>';

        document.getElementById('teacherPortal').classList.add('active');

        // Fetch all users' progress from Firestore
        const snapshot = await db.collection('users').get();

        if (snapshot.empty) {
            teacherContent.innerHTML = '<p style="color: #999;">No student data found yet.</p>';
            return;
        }

        let studentsHTML = '<div style="max-height: 500px; overflow-y: auto;">';

        snapshot.forEach((doc) => {
            const data = doc.data();
            const progress = data.progressData || {};
            const studentId = doc.id;

            // Skip teacher's own account
            if (studentId === currentUser.uid) return;

            const totalMastered = Object.keys(progress.masteredWords || {}).length;
            const totalSessions = (progress.sessions || []).length;
            const accuracy = progress.totalWordsAttempted > 0
                ? Math.round((progress.totalWordsCorrect / progress.totalWordsAttempted) * 100)
                : 0;
            const flowers = progress.flowerProgress || 0;

            studentsHTML += `
                <div style="background: linear-gradient(135deg, #ffd3f0, #ffe6f7); padding: 15px; border-radius: 15px; margin-bottom: 15px;">
                    <h3 style="color: #ff69b4; margin-bottom: 10px;">Student: ${studentId.substring(0, 8)}...</h3>
                    <p><strong>📚 Words Mastered:</strong> ${totalMastered}</p>
                    <p><strong>📝 Practice Sessions:</strong> ${totalSessions}</p>
                    <p><strong>✅ Accuracy:</strong> ${accuracy}%</p>
                    <p><strong>🌸 Flowers Bloomed:</strong> ${flowers}/20</p>
                </div>
            `;
        });

        studentsHTML += '</div>';
        teacherContent.innerHTML = studentsHTML;

    } catch (error) {
        console.error('Error loading teacher portal:', error);
        document.getElementById('teacherContent').innerHTML = '<p style="color: red;">Error loading student data.</p>';
    }
}

/**
 * Closes the teacher portal
 */
function closeTeacherPortal() {
    document.getElementById('teacherPortal').classList.remove('active');
}

// ============================================================================
// SVG ANIMAL DEFINITIONS
// ============================================================================

const animals = {
    capybaraPointing: `
        <!-- Capybara body for 'There' - pointing -->
        <ellipse cx="100" cy="120" rx="60" ry="45" fill="#d4a574" />
        <!-- Legs -->
        <rect x="70" y="150" width="15" height="30" rx="7" fill="#c49464" />
        <rect x="115" y="150" width="15" height="30" rx="7" fill="#c49464" />
        <!-- Head -->
        <ellipse cx="100" cy="80" rx="40" ry="35" fill="#d4a574" />
        <!-- Ears -->
        <ellipse cx="75" cy="60" rx="12" ry="18" fill="#c49464" />
        <ellipse cx="125" cy="60" rx="12" ry="18" fill="#c49464" />
        <!-- Eyes -->
        <circle cx="85" cy="75" r="8" fill="#2c1810" />
        <circle cx="115" cy="75" r="8" fill="#2c1810" />
        <circle cx="87" cy="73" r="3" fill="white" />
        <circle cx="117" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <ellipse cx="100" cy="90" rx="8" ry="6" fill="#8b6f47" />
        <!-- Mouth -->
        <path d="M 95 95 Q 100 98 105 95" stroke="#8b6f47" stroke-width="2" fill="none" />
        <!-- Pointing arm! -->
        <ellipse cx="155" cy="100" rx="12" ry="35" fill="#c49464" transform="rotate(-30 155 100)" />
        <circle cx="170" cy="85" r="8" fill="#c49464" />
        <!-- Arrow to emphasize pointing -->
        <path d="M 175 80 L 185 75 L 180 85 Z" fill="#ff69b4" />
    `,
    capybara: `
        <!-- Capybara body -->
        <ellipse cx="100" cy="120" rx="60" ry="45" fill="#d4a574" />
        <!-- Legs -->
        <rect x="70" y="150" width="15" height="30" rx="7" fill="#c49464" />
        <rect x="115" y="150" width="15" height="30" rx="7" fill="#c49464" />
        <!-- Head -->
        <ellipse cx="100" cy="80" rx="40" ry="35" fill="#d4a574" />
        <!-- Ears -->
        <ellipse cx="75" cy="60" rx="12" ry="18" fill="#c49464" />
        <ellipse cx="125" cy="60" rx="12" ry="18" fill="#c49464" />
        <!-- Eyes -->
        <circle cx="85" cy="75" r="8" fill="#2c1810" />
        <circle cx="115" cy="75" r="8" fill="#2c1810" />
        <circle cx="87" cy="73" r="3" fill="white" />
        <circle cx="117" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <ellipse cx="100" cy="90" rx="8" ry="6" fill="#8b6f47" />
        <!-- Mouth -->
        <path d="M 95 95 Q 100 98 105 95" stroke="#8b6f47" stroke-width="2" fill="none" />
        <!-- Grass decoration -->
        <line x1="40" y1="165" x2="35" y2="145" stroke="#7dd3c0" stroke-width="3" />
        <line x1="50" y1="170" x2="48" y2="150" stroke="#98e5d5" stroke-width="3" />
        <line x1="150" y1="170" x2="152" y2="150" stroke="#7dd3c0" stroke-width="3" />
        <line x1="160" y1="165" x2="165" y2="145" stroke="#98e5d5" stroke-width="3" />
    `,
    bunnyKneadingBread: `
        <!-- Bunny body for 'Bread' - kneading -->
        <ellipse cx="100" cy="130" rx="45" ry="40" fill="#ffd1dc" />
        <!-- Head -->
        <circle cx="100" cy="80" r="35" fill="#ffd1dc" />
        <!-- Ears -->
        <ellipse cx="85" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="85" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <ellipse cx="115" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="115" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <!-- Eyes -->
        <circle cx="88" cy="75" r="7" fill="#2c1810" />
        <circle cx="112" cy="75" r="7" fill="#2c1810" />
        <circle cx="90" cy="73" r="3" fill="white" />
        <circle cx="114" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <circle cx="100" cy="88" r="5" fill="#ff69b4" />
        <!-- Mouth -->
        <path d="M 100 88 L 95 95" stroke="#ff69b4" stroke-width="2" />
        <path d="M 100 88 L 105 95" stroke="#ff69b4" stroke-width="2" />
        <!-- Bread loaf with letter A! -->
        <ellipse cx="100" cy="155" rx="35" ry="20" fill="#f4e4c1" />
        <ellipse cx="100" cy="150" rx="30" ry="15" fill="#e6d4a8" />
        <!-- Big letter A on the bread! -->
        <text x="100" y="158" font-size="24" font-weight="bold" fill="#8b6f47" text-anchor="middle" font-family="Arial">A</text>
        <!-- Kneading paws on bread -->
        <circle cx="80" cy="150" r="10" fill="#ffd1dc" />
        <circle cx="120" cy="150" r="10" fill="#ffd1dc" />
        <!-- Tail -->
        <circle cx="60" cy="130" r="12" fill="#ffb3d9" />
    `,
    bunny: `
        <!-- Bunny body -->
        <ellipse cx="100" cy="130" rx="45" ry="40" fill="#ffd1dc" />
        <!-- Head -->
        <circle cx="100" cy="80" r="35" fill="#ffd1dc" />
        <!-- Ears -->
        <ellipse cx="85" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="85" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <ellipse cx="115" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="115" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <!-- Eyes -->
        <circle cx="88" cy="75" r="7" fill="#2c1810" />
        <circle cx="112" cy="75" r="7" fill="#2c1810" />
        <circle cx="90" cy="73" r="3" fill="white" />
        <circle cx="114" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <circle cx="100" cy="88" r="5" fill="#ff69b4" />
        <!-- Mouth -->
        <path d="M 100 88 L 95 95" stroke="#ff69b4" stroke-width="2" />
        <path d="M 100 88 L 105 95" stroke="#ff69b4" stroke-width="2" />
        <!-- Feet -->
        <ellipse cx="85" cy="165" rx="15" ry="10" fill="#ffd1dc" />
        <ellipse cx="115" cy="165" rx="15" ry="10" fill="#ffd1dc" />
        <!-- Tail -->
        <circle cx="60" cy="130" r="12" fill="#ffb3d9" />
    `,
    rabbitLiftingLeg: `
        <!-- Rabbit for 'Leg' - leg raised -->
        <ellipse cx="100" cy="130" rx="45" ry="40" fill="#ffd1dc" />
        <!-- Head -->
        <circle cx="100" cy="80" r="35" fill="#ffd1dc" />
        <!-- Ears -->
        <ellipse cx="85" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="85" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <ellipse cx="115" cy="40" rx="12" ry="35" fill="#ffd1dc" />
        <ellipse cx="115" cy="40" rx="8" ry="28" fill="#ffb3d9" />
        <!-- Eyes -->
        <circle cx="88" cy="75" r="7" fill="#2c1810" />
        <circle cx="112" cy="75" r="7" fill="#2c1810" />
        <circle cx="90" cy="73" r="3" fill="white" />
        <circle cx="114" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <circle cx="100" cy="88" r="5" fill="#ff69b4" />
        <!-- Mouth -->
        <path d="M 100 88 L 95 95" stroke="#ff69b4" stroke-width="2" />
        <path d="M 100 88 L 105 95" stroke="#ff69b4" stroke-width="2" />
        <!-- One foot on ground -->
        <ellipse cx="85" cy="165" rx="15" ry="10" fill="#ffd1dc" />
        <!-- One leg RAISED! -->
        <ellipse cx="130" cy="120" rx="12" ry="30" fill="#ffd1dc" transform="rotate(45 130 120)" />
        <ellipse cx="145" cy="110" rx="12" ry="8" fill="#ffb3d9" />
        <!-- Tail -->
        <circle cx="60" cy="130" r="12" fill="#ffb3d9" />
    `,
    hamsterClapping: `
        <!-- Hamster body for 'Again' - clapping -->
        <ellipse cx="100" cy="120" rx="50" ry="45" fill="#f4e4c1" />
        <!-- Head -->
        <circle cx="100" cy="75" r="38" fill="#f4e4c1" />
        <!-- Ears -->
        <circle cx="75" cy="55" r="15" fill="#e6d4a8" />
        <circle cx="75" cy="55" r="10" fill="#f4e4c1" />
        <circle cx="125" cy="55" r="15" fill="#e6d4a8" />
        <circle cx="125" cy="55" r="10" fill="#f4e4c1" />
        <!-- Eyes (happy closed) -->
        <path d="M 82 70 Q 88 65 94 70" stroke="#2c1810" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M 106 70 Q 112 65 118 70" stroke="#2c1810" stroke-width="3" fill="none" stroke-linecap="round" />
        <!-- Cheeks -->
        <circle cx="65" cy="80" r="18" fill="#ffe4e1" opacity="0.7" />
        <circle cx="135" cy="80" r="18" fill="#ffe4e1" opacity="0.7" />
        <!-- Nose -->
        <circle cx="100" cy="85" r="5" fill="#d4a574" />
        <!-- Happy mouth -->
        <path d="M 90 95 Q 100 100 110 95" stroke="#d4a574" stroke-width="2" fill="none" />
        <!-- Clapping paws! -->
        <circle cx="65" cy="110" r="12" fill="#e6d4a8" />
        <circle cx="85" cy="110" r="12" fill="#e6d4a8" />
        <!-- Motion lines for clapping -->
        <path d="M 60 105 L 55 100" stroke="#ff69b4" stroke-width="2" opacity="0.6" />
        <path d="M 90 105 L 95 100" stroke="#ff69b4" stroke-width="2" opacity="0.6" />
        <!-- Feet -->
        <ellipse cx="85" cy="160" rx="18" ry="12" fill="#e6d4a8" />
        <ellipse cx="115" cy="160" rx="18" ry="12" fill="#e6d4a8" />
    `,
    hamster: `
        <!-- Hamster body -->
        <ellipse cx="100" cy="120" rx="50" ry="45" fill="#f4e4c1" />
        <!-- Head -->
        <circle cx="100" cy="75" r="38" fill="#f4e4c1" />
        <!-- Ears -->
        <circle cx="75" cy="55" r="15" fill="#e6d4a8" />
        <circle cx="75" cy="55" r="10" fill="#f4e4c1" />
        <circle cx="125" cy="55" r="15" fill="#e6d4a8" />
        <circle cx="125" cy="55" r="10" fill="#f4e4c1" />
        <!-- Eyes -->
        <circle cx="88" cy="70" r="8" fill="#2c1810" />
        <circle cx="112" cy="70" r="8" fill="#2c1810" />
        <circle cx="90" cy="68" r="3" fill="white" />
        <circle cx="114" cy="68" r="3" fill="white" />
        <!-- Cheeks -->
        <circle cx="65" cy="80" r="18" fill="#ffe4e1" opacity="0.7" />
        <circle cx="135" cy="80" r="18" fill="#ffe4e1" opacity="0.7" />
        <!-- Nose -->
        <circle cx="100" cy="85" r="5" fill="#d4a574" />
        <!-- Mouth -->
        <path d="M 95 90 Q 100 93 105 90" stroke="#d4a574" stroke-width="2" fill="none" />
        <!-- Feet -->
        <ellipse cx="80" cy="160" rx="18" ry="12" fill="#e6d4a8" />
        <ellipse cx="120" cy="160" rx="18" ry="12" fill="#e6d4a8" />
        <!-- Hands -->
        <circle cx="70" cy="110" r="10" fill="#e6d4a8" />
        <circle cx="130" cy="110" r="10" fill="#e6d4a8" />
    `,
    guineaPigTappingHead: `
        <!-- Guinea pig for 'Head' - tapping head -->
        <ellipse cx="100" cy="125" rx="55" ry="48" fill="#e6ccb3" />
        <!-- Head -->
        <ellipse cx="100" cy="80" rx="42" ry="38" fill="#e6ccb3" />
        <!-- Ears -->
        <ellipse cx="78" cy="60" rx="10" ry="15" fill="#d4b89f" />
        <ellipse cx="122" cy="60" rx="10" ry="15" fill="#d4b89f" />
        <!-- Eyes -->
        <circle cx="88" cy="75" r="9" fill="#2c1810" />
        <circle cx="112" cy="75" r="9" fill="#2c1810" />
        <circle cx="90" cy="73" r="3" fill="white" />
        <circle cx="114" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <ellipse cx="100" cy="90" rx="7" ry="5" fill="#c49464" />
        <!-- Mouth -->
        <path d="M 100 90 L 95 97" stroke="#c49464" stroke-width="2" />
        <path d="M 100 90 L 105 97" stroke="#c49464" stroke-width="2" />
        <!-- Paw tapping head! -->
        <circle cx="120" cy="65" r="10" fill="#d4b89f" />
        <path d="M 125 60 L 130 55" stroke="#ff69b4" stroke-width="2" opacity="0.6" />
        <!-- Feet -->
        <ellipse cx="75" cy="165" rx="18" ry="12" fill="#d4b89f" />
        <ellipse cx="125" cy="165" rx="18" ry="12" fill="#d4b89f" />
        <!-- Fur pattern -->
        <ellipse cx="120" cy="110" rx="20" ry="15" fill="#d4b89f" opacity="0.5" />
        <ellipse cx="80" cy="130" rx="18" ry="12" fill="#d4b89f" opacity="0.5" />
    `,
    guineaPig: `
        <!-- Guinea pig body -->
        <ellipse cx="100" cy="125" rx="55" ry="48" fill="#e6ccb3" />
        <!-- Head -->
        <ellipse cx="100" cy="80" rx="42" ry="38" fill="#e6ccb3" />
        <!-- Ears -->
        <ellipse cx="78" cy="60" rx="10" ry="15" fill="#d4b89f" />
        <ellipse cx="122" cy="60" rx="10" ry="15" fill="#d4b89f" />
        <!-- Eyes -->
        <circle cx="88" cy="75" r="9" fill="#2c1810" />
        <circle cx="112" cy="75" r="9" fill="#2c1810" />
        <circle cx="90" cy="73" r="3" fill="white" />
        <circle cx="114" cy="73" r="3" fill="white" />
        <!-- Nose -->
        <ellipse cx="100" cy="90" rx="7" ry="5" fill="#c49464" />
        <!-- Mouth -->
        <path d="M 100 90 L 95 97" stroke="#c49464" stroke-width="2" />
        <path d="M 100 90 L 105 97" stroke="#c49464" stroke-width="2" />
        <!-- Feet -->
        <ellipse cx="75" cy="165" rx="18" ry="12" fill="#d4b89f" />
        <ellipse cx="125" cy="165" rx="18" ry="12" fill="#d4b89f" />
        <!-- Fur pattern -->
        <ellipse cx="120" cy="110" rx="20" ry="15" fill="#d4b89f" opacity="0.5" />
        <ellipse cx="80" cy="130" rx="18" ry="12" fill="#d4b89f" opacity="0.5" />
    `,
    axolotlInGrass: `
        <!-- Axolotl for 'Grass' - in grass -->
        <!-- Grass first (background) -->
        <rect x="20" y="140" width="8" height="50" rx="4" fill="#7dd3c0" />
        <rect x="35" y="135" width="8" height="55" rx="4" fill="#98e5d5" />
        <rect x="50" y="145" width="8" height="45" rx="4" fill="#7dd3c0" />
        <rect x="140" y="140" width="8" height="50" rx="4" fill="#98e5d5" />
        <rect x="155" y="135" width="8" height="55" rx="4" fill="#7dd3c0" />
        <rect x="170" y="145" width="8" height="45" rx="4" fill="#98e5d5" />
        <!-- Axolotl body -->
        <ellipse cx="100" cy="110" rx="50" ry="35" fill="#ffc0cb" />
        <!-- Tail -->
        <path d="M 150 110 Q 170 105 175 115 Q 170 125 150 120 Z" fill="#ffc0cb" />
        <path d="M 160 108 Q 165 105 168 110 Q 165 115 160 112 Z" fill="#ffb3d9" />
        <!-- Head -->
        <circle cx="65" cy="100" r="35" fill="#ffc0cb" />
        <!-- Gills (left) -->
        <path d="M 55 85 L 35 75 L 40 80 L 35 85 Z" fill="#ff69b4" />
        <path d="M 50 95 L 30 90 L 35 95 L 30 100 Z" fill="#ff69b4" />
        <path d="M 55 105 L 35 110 L 40 105 L 35 100 Z" fill="#ff69b4" />
        <!-- Gills (right - top) -->
        <path d="M 65 70 L 55 50 L 60 55 L 65 50 Z" fill="#ff69b4" />
        <path d="M 70 70 L 70 50 L 72 55 L 75 50 Z" fill="#ff69b4" />
        <path d="M 75 70 L 85 50 L 82 55 L 85 60 Z" fill="#ff69b4" />
        <!-- Eyes -->
        <circle cx="58" cy="95" r="7" fill="#2c1810" />
        <circle cx="60" cy="93" r="2" fill="white" />
        <!-- Smile -->
        <path d="M 50 105 Q 60 110 70 105" stroke="#ff1493" stroke-width="2" fill="none" />
        <!-- Legs -->
        <ellipse cx="75" cy="135" rx="8" ry="15" fill="#ffc0cb" />
        <ellipse cx="100" cy="138" rx="8" ry="15" fill="#ffc0cb" />
        <ellipse cx="125" cy="135" rx="8" ry="15" fill="#ffc0cb" />
        <!-- Belly spots -->
        <ellipse cx="100" cy="115" rx="12" ry="8" fill="#ffb3d9" opacity="0.5" />
        <ellipse cx="120" cy="110" rx="10" ry="6" fill="#ffb3d9" opacity="0.5" />
        <!-- More grass (foreground) -->
        <rect x="65" y="140" width="8" height="50" rx="4" fill="#98e5d5" />
        <rect x="125" y="145" width="8" height="45" rx="4" fill="#7dd3c0" />
    `,
    axolotl: `
        <!-- Axolotl body -->
        <ellipse cx="100" cy="110" rx="50" ry="35" fill="#ffc0cb" />
        <!-- Tail -->
        <path d="M 150 110 Q 170 105 175 115 Q 170 125 150 120 Z" fill="#ffc0cb" />
        <path d="M 160 108 Q 165 105 168 110 Q 165 115 160 112 Z" fill="#ffb3d9" />
        <!-- Head -->
        <circle cx="65" cy="100" r="35" fill="#ffc0cb" />
        <!-- Gills (left) -->
        <path d="M 55 85 L 35 75 L 40 80 L 35 85 Z" fill="#ff69b4" />
        <path d="M 50 95 L 30 90 L 35 95 L 30 100 Z" fill="#ff69b4" />
        <path d="M 55 105 L 35 110 L 40 105 L 35 100 Z" fill="#ff69b4" />
        <!-- Gills (right - top) -->
        <path d="M 65 70 L 55 50 L 60 55 L 65 50 Z" fill="#ff69b4" />
        <path d="M 70 70 L 70 50 L 72 55 L 75 50 Z" fill="#ff69b4" />
        <path d="M 75 70 L 85 50 L 82 55 L 85 60 Z" fill="#ff69b4" />
        <!-- Eyes -->
        <circle cx="58" cy="95" r="7" fill="#2c1810" />
        <circle cx="60" cy="93" r="2" fill="white" />
        <!-- Smile -->
        <path d="M 50 105 Q 60 110 70 105" stroke="#ff1493" stroke-width="2" fill="none" />
        <!-- Legs -->
        <ellipse cx="75" cy="135" rx="8" ry="15" fill="#ffc0cb" />
        <ellipse cx="100" cy="138" rx="8" ry="15" fill="#ffc0cb" />
        <ellipse cx="125" cy="135" rx="8" ry="15" fill="#ffc0cb" />
        <!-- Belly spots -->
        <ellipse cx="100" cy="115" rx="12" ry="8" fill="#ffb3d9" opacity="0.5" />
        <ellipse cx="120" cy="110" rx="10" ry="6" fill="#ffb3d9" opacity="0.5" />
    `,
    horseSaluting: `
        <!-- Horse for 'Men' - saluting -->
        <ellipse cx="100" cy="125" rx="55" ry="45" fill="#e0b0ff" />
        <!-- Neck -->
        <rect x="55" y="70" width="30" height="60" rx="15" fill="#e0b0ff" />
        <!-- Head -->
        <ellipse cx="60" cy="60" rx="25" ry="30" fill="#e0b0ff" />
        <!-- Ears -->
        <path d="M 50 35 L 45 25 L 55 30 Z" fill="#d8a0ff" />
        <path d="M 70 35 L 75 25 L 65 30 Z" fill="#d8a0ff" />
        <!-- Mane -->
        <path d="M 75 40 Q 85 35 85 50" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 50 Q 88 45 88 65" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 65 Q 90 60 90 80" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <!-- Eyes -->
        <circle cx="55" cy="55" r="6" fill="#2c1810" />
        <circle cx="57" cy="53" r="2" fill="white" />
        <!-- Nose -->
        <ellipse cx="48" cy="70" rx="8" ry="10" fill="#d8a0ff" />
        <circle cx="46" cy="68" r="2" fill="#8b4789" />
        <circle cx="46" cy="72" r="2" fill="#8b4789" />
        <!-- Mouth -->
        <path d="M 45 78 Q 50 80 55 78" stroke="#8b4789" stroke-width="2" fill="none" />
        <!-- SALUTING HOOF! -->
        <ellipse cx="45" cy="45" rx="10" ry="25" fill="#d8a0ff" transform="rotate(-45 45 45)" />
        <rect x="42" y="28" width="6" height="8" rx="3" fill="#8b4789" />
        <!-- Legs -->
        <rect x="70" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="95" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="120" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="145" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <!-- Hooves -->
        <rect x="68" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="93" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="118" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="143" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <!-- Tail -->
        <path d="M 155 120 Q 175 115 180 130" stroke="#c88fff" stroke-width="10" fill="none" stroke-linecap="round" />
    `,
    horseSpinning: `
        <!-- Horse for 'Spin' - spinning with motion lines -->
        <ellipse cx="100" cy="125" rx="55" ry="45" fill="#e0b0ff" />
        <!-- Neck -->
        <rect x="55" y="70" width="30" height="60" rx="15" fill="#e0b0ff" />
        <!-- Head -->
        <ellipse cx="60" cy="60" rx="25" ry="30" fill="#e0b0ff" />
        <!-- Ears -->
        <path d="M 50 35 L 45 25 L 55 30 Z" fill="#d8a0ff" />
        <path d="M 70 35 L 75 25 L 65 30 Z" fill="#d8a0ff" />
        <!-- Mane -->
        <path d="M 75 40 Q 85 35 85 50" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 50 Q 88 45 88 65" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 65 Q 90 60 90 80" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <!-- Eyes -->
        <circle cx="55" cy="55" r="6" fill="#2c1810" />
        <circle cx="57" cy="53" r="2" fill="white" />
        <!-- Nose -->
        <ellipse cx="48" cy="70" rx="8" ry="10" fill="#d8a0ff" />
        <circle cx="46" cy="68" r="2" fill="#8b4789" />
        <circle cx="46" cy="72" r="2" fill="#8b4789" />
        <!-- Mouth -->
        <path d="M 45 78 Q 50 80 55 78" stroke="#8b4789" stroke-width="2" fill="none" />
        <!-- Legs -->
        <rect x="70" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="95" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="120" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="145" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <!-- Hooves -->
        <rect x="68" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="93" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="118" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="143" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <!-- Tail -->
        <path d="M 155 120 Q 175 115 180 130" stroke="#c88fff" stroke-width="10" fill="none" stroke-linecap="round" />
        <!-- SPINNING MOTION LINES! -->
        <path d="M 30 100 Q 20 100 15 95" stroke="#ff69b4" stroke-width="3" fill="none" opacity="0.7" />
        <path d="M 25 120 Q 15 125 10 130" stroke="#ff69b4" stroke-width="3" fill="none" opacity="0.7" />
        <path d="M 170 100 Q 180 100 185 95" stroke="#ff69b4" stroke-width="3" fill="none" opacity="0.7" />
        <path d="M 175 120 Q 185 125 190 130" stroke="#ff69b4" stroke-width="3" fill="none" opacity="0.7" />
        <circle cx="100" cy="100" r="80" stroke="#e0b0ff" stroke-width="2" fill="none" opacity="0.3" stroke-dasharray="10,5" />
    `,
    horse: `
        <!-- Horse body -->
        <ellipse cx="100" cy="125" rx="55" ry="45" fill="#e0b0ff" />
        <!-- Neck -->
        <rect x="55" y="70" width="30" height="60" rx="15" fill="#e0b0ff" />
        <!-- Head -->
        <ellipse cx="60" cy="60" rx="25" ry="30" fill="#e0b0ff" />
        <!-- Ears -->
        <path d="M 50 35 L 45 25 L 55 30 Z" fill="#d8a0ff" />
        <path d="M 70 35 L 75 25 L 65 30 Z" fill="#d8a0ff" />
        <!-- Mane -->
        <path d="M 75 40 Q 85 35 85 50" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 50 Q 88 45 88 65" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M 75 65 Q 90 60 90 80" stroke="#c88fff" stroke-width="8" fill="none" stroke-linecap="round" />
        <!-- Eyes -->
        <circle cx="55" cy="55" r="6" fill="#2c1810" />
        <circle cx="57" cy="53" r="2" fill="white" />
        <!-- Nose -->
        <ellipse cx="48" cy="70" rx="8" ry="10" fill="#d8a0ff" />
        <circle cx="46" cy="68" r="2" fill="#8b4789" />
        <circle cx="46" cy="72" r="2" fill="#8b4789" />
        <!-- Mouth -->
        <path d="M 45 78 Q 50 80 55 78" stroke="#8b4789" stroke-width="2" fill="none" />
        <!-- Legs -->
        <rect x="70" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="95" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="120" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <rect x="145" y="155" width="12" height="35" rx="6" fill="#d8a0ff" />
        <!-- Hooves -->
        <rect x="68" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="93" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="118" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <rect x="143" y="185" width="16" height="8" rx="4" fill="#8b4789" />
        <!-- Tail -->
        <path d="M 155 120 Q 175 115 180 130" stroke="#c88fff" stroke-width="10" fill="none" stroke-linecap="round" />
    `,
    catBegging: `
        <!-- Cat for 'Beg' - begging with pleading paws -->
        <!-- Body -->
        <ellipse cx="100" cy="130" rx="40" ry="35" fill="#ffd1dc" />
        <!-- Head -->
        <circle cx="100" cy="85" r="32" fill="#ffd1dc" />
        <!-- Ears -->
        <path d="M 75 60 L 65 40 L 80 55 Z" fill="#ffd1dc" />
        <path d="M 75 60 L 70 45 L 78 57 Z" fill="#ffb3d9" />
        <path d="M 125 60 L 135 40 L 120 55 Z" fill="#ffd1dc" />
        <path d="M 125 60 L 130 45 L 122 57 Z" fill="#ffb3d9" />
        <!-- Big pleading eyes! -->
        <ellipse cx="88" cy="80" rx="10" ry="12" fill="#2c1810" />
        <ellipse cx="112" cy="80" rx="10" ry="12" fill="#2c1810" />
        <circle cx="90" cy="77" r="4" fill="white" />
        <circle cx="114" cy="77" r="4" fill="white" />
        <circle cx="88" cy="82" r="2" fill="white" opacity="0.6" />
        <circle cx="112" cy="82" r="2" fill="white" opacity="0.6" />
        <!-- Nose -->
        <path d="M 100 92 L 97 95 L 100 96 L 103 95 Z" fill="#ff69b4" />
        <!-- Sweet pleading mouth -->
        <path d="M 95 100 Q 100 103 105 100" stroke="#ff69b4" stroke-width="2" fill="none" />
        <!-- BEGGING PAWS clasped together! -->
        <ellipse cx="90" cy="115" rx="10" ry="18" fill="#ffd1dc" />
        <ellipse cx="110" cy="115" rx="10" ry="18" fill="#ffd1dc" />
        <circle cx="90" cy="120" r="8" fill="#ffb3d9" />
        <circle cx="110" cy="120" r="8" fill="#ffb3d9" />
        <!-- Little hearts floating up (begging with love!) -->
        <path d="M 70,100 C 70,100 65,95 65,90 C 65,87 66,85 68,85 C 70,85 71,87 72,90 C 73,87 74,85 76,85 C 78,85 79,87 79,90 C 79,95 74,100 72,100 Z" fill="#ff69b4" opacity="0.6" />
        <path d="M 128,95 C 128,95 124,91 124,87 C 124,85 125,83 127,83 C 128,83 129,84 130,86 C 131,84 132,83 133,83 C 135,83 136,85 136,87 C 136,91 132,95 130,95 Z" fill="#ff69b4" opacity="0.6" />
        <!-- Sitting legs -->
        <ellipse cx="85" cy="160" rx="14" ry="10" fill="#ffd1dc" />
        <ellipse cx="115" cy="160" rx="14" ry="10" fill="#ffd1dc" />
        <!-- Tail wrapped around -->
        <path d="M 60 130 Q 50 120 55 105" stroke="#ffb3d9" stroke-width="12" fill="none" stroke-linecap="round" />
    `
};

// ============================================================================
// FLOWER TEMPLATES
// ============================================================================

const flowerTemplates = [
    `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="25" x2="20" y2="55" stroke="#7dd3c0" stroke-width="2"/>
        <circle cx="20" cy="20" r="12" fill="#ffd1dc"/>
        <circle cx="20" cy="20" r="6" fill="#ffe4e1"/>
        <circle cx="13" cy="15" r="7" fill="#ffd1dc"/>
        <circle cx="27" cy="15" r="7" fill="#ffd1dc"/>
        <circle cx="13" cy="25" r="7" fill="#ffd1dc"/>
        <circle cx="27" cy="25" r="7" fill="#ffd1dc"/>
    </svg>`,
    `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="30" x2="20" y2="55" stroke="#98e5d5" stroke-width="2"/>
        <ellipse cx="20" cy="20" rx="8" ry="12" fill="#e0b0ff"/>
        <ellipse cx="12" cy="20" rx="8" ry="12" fill="#e0b0ff" transform="rotate(-60 12 20)"/>
        <ellipse cx="28" cy="20" rx="8" ry="12" fill="#e0b0ff" transform="rotate(60 28 20)"/>
        <ellipse cx="16" cy="28" rx="8" ry="12" fill="#e0b0ff" transform="rotate(-120 16 28)"/>
        <ellipse cx="24" cy="28" rx="8" ry="12" fill="#e0b0ff" transform="rotate(120 24 28)"/>
        <circle cx="20" cy="23" r="5" fill="#d8a0ff"/>
    </svg>`,
    `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="28" x2="20" y2="55" stroke="#7dd3c0" stroke-width="2"/>
        <circle cx="20" cy="18" r="10" fill="#ffb3d9"/>
        <circle cx="20" cy="18" r="5" fill="#ffd1dc"/>
        <circle cx="12" cy="18" r="6" fill="#ffb3d9"/>
        <circle cx="28" cy="18" r="6" fill="#ffb3d9"/>
        <circle cx="20" cy="10" r="6" fill="#ffb3d9"/>
        <circle cx="20" cy="26" r="6" fill="#ffb3d9"/>
    </svg>`
];

// ============================================================================
// GAME STATE VARIABLES
// ============================================================================

let currentMode = 'study'; // 'study', 'test', or 'action'
let currentWordIndex = 0;
let masteredWords = 0;
let currentWord = '';
let wordOrder = []; // For randomization

// Learn Mode Step State ('listen', 'trace', 'type', 'celebrate')
let currentStep = 'listen';
let hasListened = false;
let hasTraced = false;

// ============================================================================
// ACTION CUES AND WORD DATA
// ============================================================================

// Default Weekly Words
let weeklyWords = ['The', 'There', 'spin', 'Grass', 'leg', 'beg', 'head', 'bread', 'men', 'again'];

// Action cues for each word
const actionCues = {
    'there': {
        instruction: 'Point "over there!" as you spell T-H-E-R-E',
        emoji: '👉',
        audio: 'Point over there as you spell the word!'
    },
    'bread': {
        instruction: 'Pretend to knead dough as you say B-R-E-A-D',
        emoji: '🍞',
        audio: 'Pretend to knead dough as you spell the word!'
    },
    'head': {
        instruction: 'Tap your head gently with each letter: H-E-A-D',
        emoji: '👆',
        audio: 'Tap your head with each letter!'
    },
    'again': {
        instruction: 'Clap twice as you spell it — once for A-G and once for A-I-N',
        emoji: '👏',
        audio: 'Clap twice as you spell again! Do it again!'
    },
    'grass': {
        instruction: 'Wiggle fingers down low like blades of grass as you hiss "ss"',
        emoji: '🌱',
        audio: 'Wiggle your fingers low like grass and hiss at the end!'
    },
    'men': {
        instruction: 'Stand tall and salute as you spell M-E-N',
        emoji: '🫡',
        audio: 'Stand tall and salute like a soldier!'
    },
    'leg': {
        instruction: 'Lift one leg slightly for each letter: L-E-G',
        emoji: '🦵',
        audio: 'Lift your leg as you spell it!'
    },
    'beg': {
        instruction: 'Put hands together like you\'re pleading while spelling B-E-G',
        emoji: '🙏',
        audio: 'Put your hands together and beg please please please!'
    },
    'spin': {
        instruction: 'Spin around as you spell S-P-I-N',
        emoji: '💫',
        audio: 'Spin around in a circle as you spell it!'
    },
    'the': {
        instruction: 'Point to something as you spell T-H-E',
        emoji: '☝️',
        audio: 'Point to something as you spell the word!'
    },
    'mom': {
        instruction: 'Cross arms in a hug as you say each letter M-O-M',
        emoji: '🤗',
        audio: 'Give yourself a big hug for mom!'
    },
    'dad': {
        instruction: 'Pretend to tip a hat or wave as you spell D-A-D',
        emoji: '👋',
        audio: 'Wave hello to dad as you spell it!'
    }
};

// Removed: Sight Words mode no longer needed

// Animal actions paired with specific words
const animalActions = {
    'the': 'bunny',
    'there': 'capybaraPointing',
    'spin': 'horseSpinning',
    'grass': 'axolotlInGrass',
    'leg': 'rabbitLiftingLeg',
    'beg': 'catBegging',
    'head': 'guineaPigTappingHead',
    'bread': 'bunnyKneadingBread',
    'men': 'horseSaluting',
    'again': 'hamsterClapping'
};

const defaultAnimals = ['capybara', 'bunny', 'hamster', 'guineaPig', 'axolotl', 'horse'];

// Progress Tracking
let progressData = {
    masteredWords: {}, // {word: {count: number, lastMastered: timestamp, dates: []}}
    sessions: [], // [{date: timestamp, wordsCorrect: number, wordsTotal: number, mode: string}]
    totalWordsAttempted: 0,
    totalWordsCorrect: 0,
    flowerProgress: 0,
    startDate: Date.now()
};

// ============================================================================
// FIRESTORE FUNCTIONS (Progress Tracking)
// ============================================================================

/**
 * Saves progress data to Firestore
 */
async function saveProgress() {
    try {
        await db.collection('users').doc(userId).set({
            progressData: progressData,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

/**
 * Loads progress data from Firestore
 */
async function loadProgress() {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.progressData) {
                progressData = data.progressData;
            }
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
    }
}

/**
 * Records a word as mastered
 */
async function recordWordMastered(word) {
    const wordLower = word.toLowerCase();
    if (!progressData.masteredWords[wordLower]) {
        progressData.masteredWords[wordLower] = {
            count: 0,
            lastMastered: null,
            dates: []
        };
    }
    progressData.masteredWords[wordLower].count++;
    progressData.masteredWords[wordLower].lastMastered = Date.now();
    progressData.masteredWords[wordLower].dates.push(Date.now());
    progressData.totalWordsCorrect++;
    await saveProgress();
}

/**
 * Records a word attempt
 */
async function recordWordAttempt() {
    progressData.totalWordsAttempted++;
    await saveProgress();
}

/**
 * Records a practice session
 */
async function recordSession(wordsCorrect, wordsTotal, mode) {
    progressData.sessions.push({
        date: Date.now(),
        wordsCorrect: wordsCorrect,
        wordsTotal: wordsTotal,
        mode: mode
    });
    await saveProgress();
}

/**
 * Resets all progress data
 */
async function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
        progressData = {
            masteredWords: {},
            sessions: [],
            totalWordsAttempted: 0,
            totalWordsCorrect: 0,
            flowerProgress: 0,
            startDate: Date.now()
        };
        await saveProgress();
        resetFlowerGarden();
        alert('Progress has been reset!');
    }
}

// ============================================================================
// CANVAS SETUP (Tracing)
// ============================================================================

const canvas = document.getElementById('tracingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/**
 * Sets up canvas drawing events (mouse and touch)
 */
function setupCanvas() {
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create glitter trail
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    // Glitter gradient
    const gradient = ctx.createLinearGradient(lastX, lastY, x, y);
    gradient.addColorStop(0, '#ff69b4');
    gradient.addColorStop(0.5, '#e0b0ff');
    gradient.addColorStop(1, '#98e5d5');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffd1dc';
    ctx.stroke();

    lastX = x;
    lastY = y;

    // Add glitter particles
    if (Math.random() > 0.5) {
        createGlitterParticle(e.clientX, e.clientY);
    }
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function clearTracing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ============================================================================
// WORD MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Loads saved weekly words from localStorage
 */
function loadWeeklyWords() {
    const saved = localStorage.getItem('weeklyWords');
    if (saved) {
        weeklyWords = JSON.parse(saved);
    }
}

/**
 * Shuffles an array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Initializes the game
 */
async function init() {
    await loadProgress(); // Load progress from Firestore first
    loadWeeklyWords();
    // Initialize with shuffled word order for study mode
    wordOrder = shuffleArray(weeklyWords);
    createFlowerGarden();
    setupCanvas();
    startNewWord();
}

// ============================================================================
// MODE AND GAME FLOW FUNCTIONS
// ============================================================================

/**
 * Sets the game mode (study, test, or action)
 */
function setMode(mode) {
    currentMode = mode;
    currentWordIndex = 0;
    masteredWords = 0;

    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (mode === 'study') {
        document.querySelector('.mode-button.study').classList.add('active');
        wordOrder = shuffleArray(weeklyWords);
    } else if (mode === 'test') {
        document.querySelector('.mode-button.test').classList.add('active');
        wordOrder = shuffleArray(weeklyWords);
    } else if (mode === 'action') {
        document.querySelector('.mode-button.action').classList.add('active');
        wordOrder = shuffleArray(weeklyWords);
    }

    resetFlowerGarden();
    startNewWord();
}

// ============================================================================
// LEARN MODE STEP MANAGEMENT
// ============================================================================

/**
 * Updates the step indicator visual state
 */
function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        const stepName = step.getAttribute('data-step');
        step.classList.remove('active', 'completed');

        if (stepName === currentStep) {
            step.classList.add('active');
        } else if (
            (stepName === 'listen' && hasListened) ||
            (stepName === 'trace' && hasTraced && currentStep === 'type')
        ) {
            step.classList.add('completed');
        }
    });
}

/**
 * Sets the current learning step and updates UI
 */
function setStep(step) {
    currentStep = step;
    const stepIndicator = document.getElementById('stepIndicator');
    const contextualInstruction = document.getElementById('contextualInstruction');
    const instructionText = document.getElementById('instructionText');
    const stepControls = document.getElementById('stepControls');
    const primaryButton = document.getElementById('primaryStepButton');
    const skipButton = document.getElementById('skipButton');
    const tracingArea = document.getElementById('tracingArea');
    const inputArea = document.querySelector('.input-area');
    const checkButton = document.getElementById('checkButton');
    const speakButton = document.querySelector('.speak-button');

    // Update step indicator
    updateStepIndicator();

    if (step === 'listen') {
        // STEP 1: LISTEN
        instructionText.textContent = '🎧 Listen carefully to the word!';
        contextualInstruction.style.display = 'block';
        stepControls.style.display = 'none';
        tracingArea.style.display = 'none';
        inputArea.style.display = 'none';
        checkButton.style.display = 'none';
        speakButton.style.display = 'flex';

        // Auto-speak word, then auto-advance after 2 seconds
        setTimeout(() => {
            speakWord().then(() => {
                hasListened = true;
                setTimeout(() => {
                    setStep('trace');
                }, 2000);
            });
        }, 500);

    } else if (step === 'trace') {
        // STEP 2: TRACE
        instructionText.textContent = '✏️ Now trace each letter with your finger!';
        contextualInstruction.style.display = 'block';
        stepControls.style.display = 'flex';
        primaryButton.innerHTML = '<span>Done Tracing!</span><i data-lucide="arrow-right"></i>';
        skipButton.style.display = hasListened ? 'flex' : 'none';
        tracingArea.style.display = 'block';
        inputArea.style.display = 'none';
        checkButton.style.display = 'none';
        speakButton.style.display = 'flex';

        // Re-initialize Lucide icons for the new button content
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } else if (step === 'type') {
        // STEP 3: TYPE
        instructionText.textContent = '⌨️ Great! Now type the word!';
        contextualInstruction.style.display = 'block';
        stepControls.style.display = 'none';
        tracingArea.style.display = 'none';
        inputArea.style.display = 'block';
        checkButton.style.display = 'flex';
        checkButton.textContent = '✅ Check My Spelling!';
        speakButton.style.display = 'flex';

        // Focus on input
        setTimeout(() => {
            document.getElementById('spellingInput').focus();
        }, 300);
    }
}

/**
 * Advances to the next step in Learn Mode
 */
function advanceStep() {
    createSparkles(document.getElementById('primaryStepButton'));

    if (currentStep === 'listen') {
        setStep('trace');
    } else if (currentStep === 'trace') {
        hasTraced = true;
        setStep('type');
    }
}

/**
 * Skips directly to typing (for words the student knows well)
 */
function skipToType() {
    createSparkles(document.getElementById('skipButton'));
    setStep('type');
}

/**
 * Starts a new word based on current mode
 */
function startNewWord() {
    if (currentWordIndex >= wordOrder.length) {
        currentWordIndex = 0;
        // Reshuffle when looping
        if (currentMode === 'study' || currentMode === 'test' || currentMode === 'action') {
            wordOrder = shuffleArray(weeklyWords);
        }
    }

    currentWord = wordOrder[currentWordIndex];

    // Reset step state for new word
    currentStep = 'listen';
    hasListened = false;
    hasTraced = false;

    const wordDisplay = document.getElementById('wordDisplay');
    const actionInstruction = document.getElementById('actionInstruction');
    const actionDemo = document.getElementById('actionDemo');
    const tracingArea = document.getElementById('tracingArea');
    const inputArea = document.querySelector('.input-area');
    const checkButton = document.getElementById('checkButton');
    const stepIndicator = document.getElementById('stepIndicator');
    const contextualInstruction = document.getElementById('contextualInstruction');
    const stepControls = document.getElementById('stepControls');
    const speakButton = document.querySelector('.speak-button');

    // Reset displays
    actionInstruction.style.display = 'none';
    actionDemo.style.display = 'none';
    document.getElementById('spellingInput').value = '';

    if (currentMode === 'action') {
        // === ACTION MODE ===
        stepIndicator.style.display = 'none';
        contextualInstruction.style.display = 'none';
        stepControls.style.display = 'none';

        wordDisplay.textContent = currentWord.toUpperCase();
        wordDisplay.style.fontSize = '3rem';

        const actionCue = actionCues[currentWord.toLowerCase()];
        if (actionCue) {
            actionInstruction.textContent = actionCue.instruction;
            actionInstruction.style.display = 'block';
            actionDemo.textContent = actionCue.emoji;
            actionDemo.style.display = 'block';
        }

        tracingArea.style.display = 'none';
        inputArea.style.display = 'none';
        checkButton.style.display = 'flex';
        checkButton.textContent = '🎭 I Did the Action!';
        checkButton.onclick = actionComplete;
        speakButton.style.display = 'flex';
        document.getElementById('letterBoxes').innerHTML = '';

        setTimeout(() => speakActionCue(), 500);

    } else if (currentMode === 'test') {
        // === TEST MODE ===
        stepIndicator.style.display = 'none';
        contextualInstruction.style.display = 'none';
        stepControls.style.display = 'none';

        wordDisplay.textContent = '❓ Listen & Type ❓';
        wordDisplay.style.fontSize = '2rem';

        tracingArea.style.display = 'none';
        inputArea.style.display = 'block';
        checkButton.style.display = 'flex';
        checkButton.textContent = '✅ Check My Spelling!';
        checkButton.onclick = checkSpelling;
        speakButton.style.display = 'flex';

        document.getElementById('letterBoxes').innerHTML = '';
        clearTracing();

        setTimeout(() => speakWord(), 500);

    } else {
        // === LEARN MODE (STUDY) with STEP SYSTEM ===
        stepIndicator.style.display = 'flex';
        wordDisplay.textContent = currentWord;
        wordDisplay.style.fontSize = '3rem';

        createLetterBoxes(currentWord);
        clearTracing();

        // Start with Step 1: Listen
        setStep('listen');
    }

    // Update progress
    document.getElementById('progressInfo').textContent =
        `Word ${currentWordIndex + 1} of ${wordOrder.length} • ${masteredWords} flowers bloomed! 🌸`;

    // Display appropriate animal
    displayAnimal(currentWord);

    // Add spin animation for 'spin' word
    const animalSVG = document.getElementById('animalSVG');
    animalSVG.classList.remove('spinning');
    if (currentWord.toLowerCase() === 'spin') {
        setTimeout(() => {
            animalSVG.classList.add('spinning');
        }, 100);
    }

    // Update keyboard visibility
    updateKeyboardVisibility();
}

/**
 * Displays an animal SVG based on the current word
 */
function displayAnimal(word) {
    const wordLower = word.toLowerCase();
    let animalType = animalActions[wordLower] || defaultAnimals[Math.floor(Math.random() * defaultAnimals.length)];
    const animalSVG = document.getElementById('animalSVG');
    animalSVG.innerHTML = animals[animalType];
}

/**
 * Creates letter boxes for the current word
 */
function createLetterBoxes(word) {
    const container = document.getElementById('letterBoxes');
    container.innerHTML = '';

    for (let letter of word) {
        const box = document.createElement('div');
        box.className = 'letter-box';
        box.textContent = letter === ' ' ? '' : letter;
        container.appendChild(box);
    }
}

// ============================================================================
// GAME ACTION FUNCTIONS
// ============================================================================

/**
 * Checks the user's spelling answer
 */
function checkSpelling() {
    const input = document.getElementById('spellingInput').value.trim();

    if (!input) {
        showEncouragement("Type your answer first, sweetie! 💕");
        return;
    }

    if (input.toLowerCase() === currentWord.toLowerCase()) {
        // Correct!
        playSuccessSound();
        showCelebration();

        // Different encouragement for Learn Mode vs Test Mode
        if (currentMode === 'study') {
            showEncouragement('🎉 Amazing! You mastered this word! 🌟');
        } else {
            showEncouragement('✨ Perfect! You are amazing! ✨');
        }

        bloomFlower();
        masteredWords++;

        // Record mastered word in Firestore
        recordWordMastered(currentWord);
        recordWordAttempt();

        // Update button with early skip option
        const nextBtn = document.getElementById('checkButton');
        nextBtn.textContent = '➡️ Next Word!';
        nextBtn.classList.add('next-button');
        nextBtn.onclick = nextWord;

        // Show button after 1.5s, auto-advance after 2.5s
        setTimeout(() => {
            nextBtn.style.display = 'flex';
        }, 1500);

        setTimeout(() => {
            nextWord();
        }, 2500);
    } else {
        // Gentle try again
        playEncouragementSound();
        showEncouragement("Let's try again together! You've got this! 💕");

        // Give a helpful hint by showing the word briefly (but not in test mode)
        const wordDisplay = document.getElementById('wordDisplay');
        if (currentMode !== 'test') {
            wordDisplay.style.color = '#98e5d5';
            setTimeout(() => {
                wordDisplay.style.color = '#ff69b4';
            }, 1500);
        }

        document.getElementById('spellingInput').value = '';
        document.getElementById('spellingInput').focus();
    }
}

/**
 * Called when action is completed in action mode
 */
function actionComplete() {
    playSuccessSound();
    showEncouragement('Great job doing the action! You\'re amazing!');
    bloomFlower();
    masteredWords++;

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
        nextWord();
    }, 1500);
}

/**
 * Advances to the next word
 */
function nextWord() {
    currentWordIndex++;
    document.getElementById('checkButton').classList.remove('next-button');
    startNewWord();
}

// ============================================================================
// VISUAL EFFECTS (Sparkles, Celebration, Flowers)
// ============================================================================

/**
 * Creates glitter particles at specified position
 */
function createGlitterParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 6 + 3;
    const colors = ['#ff69b4', '#e0b0ff', '#98e5d5', '#ffd1dc', '#fff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = color;
    particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;

    const tx = (Math.random() - 0.5) * 100;
    const ty = (Math.random() - 0.5) * 100 - 50;
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');

    particle.style.animation = `particleFloat ${Math.random() * 0.5 + 0.5}s ease-out forwards`;

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
}

/**
 * Creates sparkles around an element
 */
function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = rect.left + rect.width / 2 + (Math.random() - 0.5) * 100 + 'px';
        sparkle.style.top = rect.top + rect.height / 2 + (Math.random() - 0.5) * 100 + 'px';
        document.body.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 2000);
    }
}

/**
 * Shows celebration animation with hearts and stars
 */
function showCelebration() {
    const celebration = document.getElementById('celebration');

    // Create SVG hearts and stars
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 200 200');

    // Star
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    star.setAttribute('d', 'M100,20 L110,70 L160,80 L120,110 L130,160 L100,135 L70,160 L80,110 L40,80 L90,70 Z');
    star.setAttribute('fill', '#ffd700');
    star.setAttribute('stroke', '#ff69b4');
    star.setAttribute('stroke-width', '3');
    svg.appendChild(star);

    // Heart
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    heart.setAttribute('d', 'M100,170 C100,170 40,130 40,90 C40,70 50,60 65,60 C80,60 90,70 100,85 C110,70 120,60 135,60 C150,60 160,70 160,90 C160,130 100,170 100,170 Z');
    heart.setAttribute('fill', '#ff69b4');
    heart.setAttribute('stroke', '#fff');
    heart.setAttribute('stroke-width', '2');
    svg.appendChild(heart);

    celebration.innerHTML = '';
    celebration.appendChild(svg);
    celebration.classList.add('show');

    setTimeout(() => {
        celebration.classList.remove('show');
    }, 1000);
}

/**
 * Shows encouragement message to the user
 */
function showEncouragement(message) {
    const encouragement = document.getElementById('encouragement');
    encouragement.textContent = message;
    encouragement.classList.add('show');

    setTimeout(() => {
        encouragement.classList.remove('show');
    }, 2000);
}

/**
 * Creates the flower garden
 */
function createFlowerGarden() {
    const garden = document.getElementById('flowerGarden');

    for (let i = 0; i < 20; i++) {
        const flower = document.createElement('div');
        flower.className = 'flower';
        flower.id = 'flower' + i;
        flower.innerHTML = flowerTemplates[i % flowerTemplates.length];
        garden.appendChild(flower);
    }

    // Restore bloomed flowers from saved progress
    for (let i = 0; i < progressData.flowerProgress; i++) {
        const flower = document.getElementById('flower' + i);
        if (flower) {
            flower.classList.add('bloomed');
        }
    }
}

/**
 * Blooms the next unbloomed flower
 */
function bloomFlower() {
    const flowers = document.querySelectorAll('.flower:not(.bloomed)');
    if (flowers.length > 0) {
        flowers[0].classList.add('bloomed');
        progressData.flowerProgress = document.querySelectorAll('.flower.bloomed').length;
        saveProgress();
    }
}

/**
 * Resets the flower garden
 */
function resetFlowerGarden() {
    document.querySelectorAll('.flower').forEach(f => f.classList.remove('bloomed'));
    progressData.flowerProgress = 0;
    saveProgress();
}

// ============================================================================
// SOUND EFFECTS (Web Audio API)
// ============================================================================

/**
 * Plays a success sound (ascending notes)
 */
function playSuccessSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create a pleasant ascending tone
    const notes = [523.25, 659.25, 783.99]; // C, E, G
    notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);

        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
    });
}

/**
 * Plays an encouragement sound
 */
function playEncouragementSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Opens the settings modal
 */
function openSettings() {
    const modal = document.getElementById('settingsModal');
    const inputsContainer = document.getElementById('wordInputs');

    inputsContainer.innerHTML = '';

    weeklyWords.forEach((word, index) => {
        const group = document.createElement('div');
        group.className = 'word-input-group';

        const label = document.createElement('label');
        label.textContent = `Word ${index + 1}:`;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = word;
        input.id = `word${index}`;

        group.appendChild(label);
        group.appendChild(input);
        inputsContainer.appendChild(group);
    });

    modal.classList.add('active');
}

/**
 * Closes the settings modal
 */
function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

/**
 * Opens the progress dashboard
 */
function openProgressDashboard() {
    // Calculate stats
    const totalMastered = Object.keys(progressData.masteredWords).length;
    const totalSessions = progressData.sessions.length;
    const accuracyRate = progressData.totalWordsAttempted > 0
        ? Math.round((progressData.totalWordsCorrect / progressData.totalWordsAttempted) * 100)
        : 0;

    // Update overall stats
    document.getElementById('totalMastered').textContent = totalMastered;
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('accuracyRate').textContent = accuracyRate + '%';
    document.getElementById('flowersCount').textContent = progressData.flowerProgress;

    // Get words mastered this week (last 7 days)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyWordsDiv = document.getElementById('weeklyWords');
    const weeklyMastered = Object.entries(progressData.masteredWords)
        .filter(([word, data]) => data.lastMastered && data.lastMastered > oneWeekAgo)
        .map(([word, data]) => word);

    if (weeklyMastered.length > 0) {
        weeklyWordsDiv.innerHTML = '<p>' + weeklyMastered.join(', ') + '</p>';
    } else {
        weeklyWordsDiv.innerHTML = '<p style="color: #999;">No words mastered this week yet. Keep practicing!</p>';
    }

    // Top mastered words
    const topWordsDiv = document.getElementById('topWords');
    const sortedWords = Object.entries(progressData.masteredWords)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    if (sortedWords.length > 0) {
        topWordsDiv.innerHTML = sortedWords
            .map(([word, data]) => `<p>🏅 <strong>${word}</strong>: ${data.count} time${data.count > 1 ? 's' : ''}</p>`)
            .join('');
    } else {
        topWordsDiv.innerHTML = '<p style="color: #999;">Start practicing to see your top words!</p>';
    }

    document.getElementById('progressModal').classList.add('active');
}

/**
 * Closes the progress dashboard
 */
function closeProgressDashboard() {
    document.getElementById('progressModal').classList.remove('active');
}

/**
 * Saves settings (weekly words)
 */
function saveSettings() {
    const newWords = [];

    for (let i = 0; i < weeklyWords.length; i++) {
        const input = document.getElementById(`word${i}`);
        const word = input.value.trim();
        if (word) {
            newWords.push(word);
        }
    }

    if (newWords.length > 0) {
        weeklyWords = newWords;
        localStorage.setItem('weeklyWords', JSON.stringify(weeklyWords));

        showEncouragement('Words saved! Great job, parents! 💕');
        closeSettings();

        // Restart if in study, test, or action mode
        if (currentMode === 'study' || currentMode === 'test' || currentMode === 'action') {
            currentWordIndex = 0;
            masteredWords = 0;
            wordOrder = shuffleArray(weeklyWords);
            resetFlowerGarden();
            startNewWord();
        }
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Handle Enter key in spelling input
 */
document.getElementById('spellingInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const button = document.getElementById('checkButton');
        button.onclick();
    }
});

/**
 * Resize canvas for mobile
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(600, container.clientWidth - 40);
    canvas.width = maxWidth;
    canvas.style.width = maxWidth + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================================================
// ON-SCREEN KEYBOARD SETUP
// ============================================================================

/**
 * Sets up the on-screen keyboard functionality
 */
function setupOnScreenKeyboard() {
    const keyButtons = document.querySelectorAll('.key-button');
    const spellingInput = document.getElementById('spellingInput');

    keyButtons.forEach(button => {
        // Remove any existing listeners to prevent duplicates
        const oldHandler = button._keyPressHandler;
        if (oldHandler) {
            button.removeEventListener('click', oldHandler);
            button.removeEventListener('touchstart', oldHandler);
        }

        // Create handler that prevents both touch and click from firing
        let touchHandled = false;
        const handleKeyPress = (e) => {
            e.preventDefault();

            // Prevent double-firing on touch devices
            if (e.type === 'touchstart') {
                touchHandled = true;
            } else if (e.type === 'click' && touchHandled) {
                touchHandled = false;
                return;
            }

            const key = button.getAttribute('data-key');

            // Add pressed animation
            button.classList.add('pressed');
            setTimeout(() => button.classList.remove('pressed'), 300);

            if (key === 'BACKSPACE') {
                spellingInput.value = spellingInput.value.slice(0, -1);
            } else {
                spellingInput.value += key;
            }

            // Reset touch flag after a short delay
            setTimeout(() => { touchHandled = false; }, 500);
        };

        // Store handler reference for future cleanup
        button._keyPressHandler = handleKeyPress;

        button.addEventListener('click', handleKeyPress);
        button.addEventListener('touchstart', handleKeyPress, { passive: false });
    });
}

/**
 * Updates keyboard visibility based on current mode
 */
function updateKeyboardVisibility() {
    const keyboard = document.getElementById('onScreenKeyboard');

    if (currentMode === 'action') {
        keyboard.style.display = 'none';
    } else {
        keyboard.style.display = 'flex';
    }
}

/**
 * Sets up touch events for all interactive buttons
 */
function setupTouchEvents() {
    // Settings button
    const settingsBtn = document.querySelector('.settings-button');
    if (settingsBtn) {
        settingsBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            openSettings();
        }, { passive: false });
    }

    // Progress button
    const progressBtn = document.querySelector('.progress-button');
    if (progressBtn) {
        progressBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            openProgressDashboard();
        }, { passive: false });
    }

    // Clear tracing button
    const clearBtn = document.querySelector('.clear-trace-button');
    if (clearBtn) {
        clearBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            clearTracing();
        }, { passive: false });
    }

    // Mode buttons
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const mode = btn.classList.contains('study') ? 'study' :
                        btn.classList.contains('test') ? 'test' : 'action';
            setMode(mode);
        }, { passive: false });
    });
}

// ============================================================================
// FIREBASE AUTH LISTENER
// ============================================================================

/**
 * Initialize Firebase Auth listener after DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            userId = user.uid;
            if (user.email === 'teacher@emilygame.com') {
                document.getElementById('authScreen').style.display = 'none';
                showGameScreen();
            } else {
                showGameScreen();
            }
        } else {
            // User is not logged in, show auth screen
            document.getElementById('authScreen').style.display = 'flex';
            document.getElementById('gameScreen').style.display = 'none';
        }
    });
});
