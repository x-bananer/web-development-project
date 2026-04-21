const API_URL = 'https://media2.edu.metropolia.fi/restaurant';
const TOKEN_KEY = '';
const USER_KEY = '';

const profileForm = document.getElementById('profile-form');
const profileMessage = document.getElementById('profile-message');
const profileUploadButton = document.getElementById('profile-upload');
const profilePhotoInput = document.getElementById('profile-photo-input');
const profileAvatar = document.getElementById('profile-avatar');
const profileAvatarImage = document.getElementById('profile-avatar-image');
const logoutButton = document.getElementById('profile-logout');

const updateHeaderAuthButton = () => {
	const authButton = document.querySelector('.header-auth-button');
	const isLoggedIn = Boolean(localStorage.getItem(TOKEN_KEY));

	if (!authButton) return;

	authButton.href = isLoggedIn
		? authButton.dataset.profileHref
		: authButton.dataset.loginHref;
	authButton.textContent = isLoggedIn ? '☻' : 'Login';
	authButton.classList.toggle('button--login', !isLoggedIn);
	authButton.classList.toggle('button--square', isLoggedIn);
	authButton.classList.toggle('button--icon', isLoggedIn);
};

const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

const getHeaders = (headers = {}) => ({
	...headers,
	Authorization: `Bearer ${getToken()}`,
});

const setMessage = (text, isError = false) => {
	if (!profileMessage) return;

	profileMessage.textContent = text;
	profileMessage.classList.remove('profile__message--error');
	profileMessage.classList.remove('profile__message--success');
	profileMessage.classList.toggle('profile__message--error', isError);
	profileMessage.classList.toggle(
		'profile__message--success',
		!isError && Boolean(text)
	);
};

const renderAvatar = (avatar) => {
	if (!avatar) {
		profileAvatar?.classList.remove('profile__avatar--filled');
		if (profileAvatarImage) {
			profileAvatarImage.src = '../../assets/favicon.png';
		}
		return;
	}

	profileAvatar?.classList.add('profile__avatar--filled');
	if (profileAvatarImage) {
		profileAvatarImage.src = `${API_URL}/uploads/${avatar}`;
	}
};

const fillForm = (user) => {
	profileForm.querySelector('input[name="username"]').value =
		user.username || '';
	profileForm.querySelector('input[name="email"]').value = user.email || '';
	profileForm.querySelector('input[name="password"]').value = '';
	renderAvatar(user.avatar);
};

const loadUser = async () => {
	if (!getToken()) {
		window.location.href = '../login/index.html';
		return;
	}

	try {
		const response = await fetch(`${API_URL}/api/v1/users/token`, {
			headers: getHeaders(),
		});

		if (!response.ok) {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
			window.location.href = '../login/index.html';
			return;
		}

		const user = await response.json();
		localStorage.setItem(USER_KEY, JSON.stringify(user));
		fillForm(user);
	} catch (error) {
		console.error(error);
		setMessage('Could not load profile.', true);
	}
};

profileForm?.addEventListener('submit', async (event) => {
	event.preventDefault();

	const username = profileForm
		.querySelector('input[name="username"]')
		.value.trim();
	const email = profileForm.querySelector('input[name="email"]').value.trim();
	const password = profileForm
		.querySelector('input[name="password"]')
		.value.trim();

	const body = {username, email};

	if (password) {
		body.password = password;
	}

	try {
		const response = await fetch(`${API_URL}/api/v1/users`, {
			method: 'PUT',
			headers: getHeaders({'Content-Type': 'application/json'}),
			body: JSON.stringify(body),
		});
		const result = await response.json();

		if (!response.ok) {
			setMessage(result.message || 'Update failed.', true);
			return;
		}

		localStorage.setItem(USER_KEY, JSON.stringify(result.data));
		fillForm(result.data);
		setMessage('Profile updated!');
	} catch (error) {
		console.error(error);
		setMessage('Update failed.', true);
	}
});

profileUploadButton?.addEventListener('click', () => {
	profilePhotoInput?.click();
});

profilePhotoInput?.addEventListener('change', async () => {
	const file = profilePhotoInput.files?.[0];

	if (!file) {
		return;
	}

	const formData = new FormData();
	formData.append('avatar', file);

	try {
		const response = await fetch(`${API_URL}/api/v1/users/avatar`, {
			method: 'POST',
			headers: getHeaders(),
			body: formData,
		});
		const result = await response.json();

		if (!response.ok) {
			setMessage(result.error || 'Avatar upload failed.', true);
			return;
		}

		const savedUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
		const updatedUser = {...savedUser, ...result.data};
		localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
		renderAvatar(updatedUser.avatar);
		setMessage('Avatar updated.');
	} catch (error) {
		console.error(error);
		setMessage('Avatar upload failed.', true);
	}
});

logoutButton?.addEventListener('click', () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	window.location.href = '../login/index.html';
});

updateHeaderAuthButton();
loadUser();
