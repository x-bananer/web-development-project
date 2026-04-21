const API_URL = 'https://media2.edu.metropolia.fi/restaurant';
const TOKEN_KEY = 'std.token';
const USER_KEY = 'std.user';

const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');

const getStoredUser = () => {
	try {
		return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
	} catch (error) {
		console.error(error);
		return null;
	}
};

const updateHeaderAuthButton = () => {
	const authButton = document.querySelector('.header-auth-button');
	const isLoggedIn = Boolean(localStorage.getItem(TOKEN_KEY));
	const user = getStoredUser();
	const avatar = user?.avatar;

	if (!authButton) return;

	authButton.href = isLoggedIn
		? authButton.dataset.profileHref
		: authButton.dataset.loginHref;
	authButton.classList.toggle('button--login', !isLoggedIn);
	authButton.classList.toggle('button--square', isLoggedIn);
	authButton.classList.toggle('button--icon', isLoggedIn);

	if (isLoggedIn && avatar) {
		authButton.innerHTML = `<img class="header-auth-button__avatar" src="${API_URL}/uploads/${avatar}" alt="Profile avatar">`;
		return;
	}

	authButton.textContent = isLoggedIn ? '☻' : 'Login';
};

const debounce = (callback, delay = 400) => {
	let timeoutId;

	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), delay);
	};
};

const showLogin = () => {
	loginTab?.classList.add('auth__tab--active');
	signupTab?.classList.remove('auth__tab--active');
	loginForm?.classList.add('auth__form--active');
	signupForm?.classList.remove('auth__form--active');
};

const showSignup = () => {
	signupTab?.classList.add('auth__tab--active');
	loginTab?.classList.remove('auth__tab--active');
	signupForm?.classList.add('auth__form--active');
	loginForm?.classList.remove('auth__form--active');
};

const setMessage = (element, text, isError = false) => {
	if (!element) return;

	element.textContent = text;
	element.classList.toggle('auth__message--error', isError);
};

const saveAuth = (token, user) => {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const checkUsername = async (username) => {
	if (!username) return false;

	try {
		const response = await fetch(
			`${API_URL}/api/v1/users/available/${encodeURIComponent(username)}`
		);
		const result = await response.json();

		if (!response.ok) {
			return false;
		}

		if (result.available) {
			return true;
		}

		return false;
	} catch (error) {
		console.error(error);
		return false;
	}
};

const handleLoginSubmit = async () => {
	const username =
		loginForm.querySelector('input[name="username"]')?.value.trim() || '';
	const password =
		loginForm.querySelector('input[name="password"]')?.value.trim() || '';

	try {
		const response = await fetch(`${API_URL}/api/v1/auth/login`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({username, password}),
		});
		const result = await response.json();

		if (!response.ok || !result.token) {
			throw new Error(result.message || 'Error.');
		}

		saveAuth(result.token, result.data);
		updateHeaderAuthButton();
		window.location.href = '../profile/index.html';
	} catch (error) {
		console.error(error);
		setMessage(loginMessage, error.message, true);
	}
};

const handleSignupSubmit = async () => {
	const username =
		signupForm.querySelector('input[name="username"]')?.value.trim() || '';
	const email =
		signupForm.querySelector('input[name="email"]')?.value.trim() || '';
	const password =
		signupForm.querySelector('input[name="password"]')?.value.trim() || '';

	const usernameAvailable = username ? await checkUsername(username) : true;

	if (!usernameAvailable) {
		setMessage(signupMessage, 'Error.', true);
		return;
	}

	try {
		const response = await fetch(`${API_URL}/api/v1/users`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({username, email, password}),
		});
		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.message || 'Error.');
		}

		setMessage(
			signupMessage,
			'Success. Now login with your username and password.'
		);
		signupForm.reset();
		showLogin();
	} catch (error) {
		console.error(error);
		setMessage(signupMessage, error.message, true);
	}
};

const debouncedLoginSubmit = debounce(handleLoginSubmit);
const debouncedSignupSubmit = debounce(handleSignupSubmit);

loginForm?.addEventListener('submit', (event) => {
	event.preventDefault();
	debouncedLoginSubmit();
});

signupForm?.addEventListener('submit', (event) => {
	event.preventDefault();
	debouncedSignupSubmit();
});
loginTab?.addEventListener('click', showLogin);
signupTab?.addEventListener('click', showSignup);
updateHeaderAuthButton();
