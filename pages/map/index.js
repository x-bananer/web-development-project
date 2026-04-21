/* global L */

const BASE_API_URL = 'https://media2.edu.metropolia.fi/restaurant';
const TOKEN_KEY = 'std.token';
const USER_KEY = 'std.user';
const HELSINKI_CENTER = [60.1699, 24.9384];
const pinIconUrl = '../../assets/icons/pin.svg';

const mapElement = document.getElementById('map');
const locateButton = document.getElementById('map-locate');
const zoomInButton = document.getElementById('map-zoom-in');
const zoomOutButton = document.getElementById('map-zoom-out');

const menuModal = document.getElementById('modal');
const menuModalClose = document.getElementById('modal-close');
const menuModalTitle = document.querySelector('.modal__title');
const menuModalCaption = document.querySelector('.modal__caption');
const dailyTab = document.getElementById('daily-tab');
const weeklyTab = document.getElementById('weekly-tab');
const dailyPanel = document.getElementById('daily-panel');
const weeklyPanel = document.getElementById('weekly-panel');

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
		authButton.innerHTML = `<img class="header-auth-button__avatar" src="${BASE_API_URL}/uploads/${avatar}" alt="Profile avatar">`;
		return;
	}

	authButton.textContent = isLoggedIn ? '☻' : 'Login';
};

let restaurants = [];
let currentRestaurantId = '';
let activeRestaurantId = '';
let nearestRestaurantId = '';
let userMarker = null;
let userCoordinates = null;
let pageScrollY = 0;

const markers = {};

const formatMenuPrices = () => {
	document.querySelectorAll('.modal__price').forEach((price) => {
		const parts = price.textContent
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length < 2) return;

		price.innerHTML = parts.map((part) => `<span>${part}</span>`).join('');
	});
};

const getTodayDate = () => {
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const today = new Date();

	return `${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]}`;
};

const getDietTags = (dietsValue) => {
	let tags = '';

	if (!dietsValue) {
		return tags;
	}

	const dietList = Array.isArray(dietsValue)
		? dietsValue
		: typeof dietsValue === 'string'
			? dietsValue.split(',')
			: [];

	dietList.forEach((diet, index) => {
		let color = 'yellow';

		if (index === 1) {
			color = 'blue';
		}

		if (index === 2) {
			color = 'pink';
		}

		if (index === 3) {
			color = 'orange';
		}

		tags += `<span class="modal__item-tag modal__item-tag--${color}">${String(diet).trim()}</span>`;
	});

	return tags;
};

const getModalAccentMarkup = () => `
    <div class="modal__accent">
        Dietary keys: A = allergen information available, G = gluten free, ILM = low lactose and milk free, Veg = vegan, VS = vegan suitable, L = lactose free, M = milk free, VL = low lactose. Please confirm ingredient lists with service staff for severe allergies.
    </div>`;

const renderDailyMenu = (courses) => {
	if (!dailyPanel) return;

	const title = dailyPanel.querySelector('.modal__group-title');
	const list = dailyPanel.querySelector('.modal__list');

	if (!title || !list) return;

	title.textContent = getTodayDate();
	title.hidden = false;
	list.innerHTML = '';

	if (!courses || courses.length === 0) {
		title.hidden = true;
		list.innerHTML = '<li class="list__stub">Nothing found...</li>';
		return;
	}

	courses.forEach((course) => {
		let price = '';
		const diets = getDietTags(course.diets);

		if (course.price) {
			price = `<span class="modal__price">${course.price}</span>`;
		}

		list.innerHTML += `
            <li class="modal__item">
                <div class="modal__item-wrap">
                    <div class="modal__meal-tags">
                        ${diets}
                    </div>
                    <div class="modal__item-title">
                        <span>${course.name}</span>
                    </div>
                </div>
                ${price}
            </li>`;
	});

	formatMenuPrices();
};

const renderWeeklyMenu = (days) => {
	if (!weeklyPanel) return;

	if (!days || days.length === 0) {
		weeklyPanel.innerHTML = `
            <div class="modal__stub">Nothing found...</div>
            ${getModalAccentMarkup()}`;
		return;
	}

	weeklyPanel.innerHTML = '';

	days.forEach((day) => {
		let coursesHtml = '';

		day.courses.forEach((course) => {
			let price = '';
			const diets = getDietTags(course.diets);

			if (course.price) {
				price = `<span class="modal__price">${course.price}</span>`;
			}

			coursesHtml += `
                <li class="modal__item modal__item--s">
                    <div class="modal__item-wrap">
                        <div class="modal__meal-tags">
                            ${diets}
                        </div>
                        <div class="modal__item-title">
                            <span>${course.name}</span>
                        </div>
                    </div>
                    ${price}
                </li>`;
		});

		weeklyPanel.innerHTML += `
            <section class="modal__group">
                <div class="modal__group-head">
                    <h3 class="modal__group-title">${day.date}</h3>
                </div>
                <ul class="modal__list">
                    ${coursesHtml}
                </ul>
            </section>`;
	});

	weeklyPanel.innerHTML += getModalAccentMarkup();

	formatMenuPrices();
};

const loadRestaurantData = async (id) => {
	try {
		const res = await fetch(`${BASE_API_URL}/api/v1/restaurants/${id}`);
		const restaurant = await res.json();

		if (menuModalTitle) {
			menuModalTitle.textContent = restaurant.name;
		}

		if (menuModalCaption) {
			menuModalCaption.textContent = `${restaurant.address}, ${restaurant.city}`;
		}
	} catch (err) {
		console.error(err);
	}
};

const loadDailyMenu = async () => {
	if (!currentRestaurantId || !dailyPanel) return;

	const title = dailyPanel.querySelector('.modal__group-title');
	const list = dailyPanel.querySelector('.modal__list');

	if (title) {
		title.textContent = getTodayDate();
		title.hidden = false;
	}

	if (list) {
		list.innerHTML = '<li class="list__stub">Loading...</li>';
	}

	try {
		const res = await fetch(
			`${BASE_API_URL}/api/v1/restaurants/daily/${currentRestaurantId}/en`
		);
		const data = await res.json();

		renderDailyMenu(data.courses);
	} catch (err) {
		console.error(err);

		if (title) {
			title.hidden = true;
		}

		if (list) {
			list.innerHTML = '<li class="list__stub">Nothing found...</li>';
		}
	}
};

const loadWeeklyMenu = async () => {
	if (!currentRestaurantId || !weeklyPanel) return;

	weeklyPanel.innerHTML = `
        <div class="modal__stub">Loading...</div>
        ${getModalAccentMarkup()}`;

	try {
		const res = await fetch(
			`${BASE_API_URL}/api/v1/restaurants/weekly/${currentRestaurantId}/en`
		);
		const data = await res.json();

		renderWeeklyMenu(data.days);
	} catch (err) {
		console.error(err);

		weeklyPanel.innerHTML = `
            <div class="modal__stub">Nothing found...</div>
            ${getModalAccentMarkup()}`;
	}
};

const openDailyMenu = () => {
	dailyTab?.classList.add('modal__tab--active');
	weeklyTab?.classList.remove('modal__tab--active');

	dailyPanel?.classList.add('modal__panel--active');
	weeklyPanel?.classList.remove('modal__panel--active');

	dailyPanel?.scrollTo(0, 0);
	loadDailyMenu();
};

const openWeeklyMenu = () => {
	weeklyTab?.classList.add('modal__tab--active');
	dailyTab?.classList.remove('modal__tab--active');

	weeklyPanel?.classList.add('modal__panel--active');
	dailyPanel?.classList.remove('modal__panel--active');

	weeklyPanel?.scrollTo(0, 0);
	loadWeeklyMenu();
};

const openMenuModal = (id) => {
	currentRestaurantId = id;
	loadRestaurantData(id);
	openDailyMenu();
	menuModal?.scrollTo(0, 0);
	dailyPanel?.scrollTo(0, 0);
	weeklyPanel?.scrollTo(0, 0);

	pageScrollY = window.scrollY;
	document.body.style.top = `-${pageScrollY}px`;
	document.body.classList.add('disable-scroll');

	menuModal?.classList.add('is-open');
};

const closeMenuModal = () => {
	activeRestaurantId = '';
	redrawMarkers();

	document.body.classList.remove('disable-scroll');
	document.body.style.top = '';
	menuModal?.classList.remove('is-open');

	window.scrollTo(0, pageScrollY);
};

const getMarkerIcon = (isActive, isNearest) => {
	const color = isActive || isNearest ? 'yellow' : 'pink';
	const label = isNearest
		? '<span class="map__marker-label">Near you</span>'
		: '';

	return L.divIcon({
		className: '',
		html: `
            <div class="map__marker map__marker--${color}">
                ${label}
                <img class="map__marker-icon" src="${pinIconUrl}" alt="">
            </div>
        `,
		iconSize: [48, 48],
		iconAnchor: [20, 44],
	});
};

const redrawMarkers = () => {
	restaurants.forEach((restaurant) => {
		const marker = markers[restaurant._id];

		if (marker) {
			marker.setIcon(
				getMarkerIcon(
					restaurant._id === activeRestaurantId,
					restaurant._id === nearestRestaurantId
				)
			);
		}
	});
};

const toRadians = (value) => (value * Math.PI) / 180;

const findNearestRestaurant = (lat, lng) => {
	let nearestRestaurant = restaurants[0];
	let nearestDistance = Infinity;

	restaurants.forEach((restaurant) => {
		const lat1 = toRadians(lat);
		const lng1 = toRadians(lng);
		const lat2 = toRadians(restaurant.lat);
		const lng2 = toRadians(restaurant.lng);
		const dLat = lat2 - lat1;
		const dLng = lng2 - lng1;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) *
				Math.cos(lat2) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = 6371 * c;

		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestRestaurant = restaurant;
		}
	});

	return nearestRestaurant;
};

const setUserLocation = (map, lat, lng) => {
	userCoordinates = [lat, lng];

	if (userMarker) {
		userMarker.setLatLng([lat, lng]);
		return;
	}

	userMarker = L.marker([lat, lng], {
		icon: L.divIcon({
			className: '',
			html: '<div class="map__user-marker"></div>',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		}),
	}).addTo(map);

	userMarker.on('click', () => {
		if (!userCoordinates) return;
		map.flyTo(userCoordinates, 15, {duration: 0.5});
	});
};

const centerMapOnUser = (map, lat, lng, moveSmoothly) => {
	if (restaurants.length > 0) {
		nearestRestaurantId = findNearestRestaurant(lat, lng)._id;
		redrawMarkers();
	}

	if (moveSmoothly) {
		map.flyTo([lat, lng], 15, {duration: 0.5});
		return;
	}

	map.setView([lat, lng], 15);
};

const getUserLocation = (map, moveSmoothly) => {
	if (!navigator.geolocation) return;

	navigator.geolocation.getCurrentPosition(
		(position) => {
			const lat = position.coords.latitude;
			const lng = position.coords.longitude;

			setUserLocation(map, lat, lng);
			centerMapOnUser(map, lat, lng, moveSmoothly);
		},
		() => {},
		{
			enableHighAccuracy: true,
			timeout: 10000,
		}
	);
};

const selectRestaurant = (map, restaurantId) => {
	const restaurant = restaurants.find((item) => item._id === restaurantId);

	if (!restaurant) return;

	activeRestaurantId = restaurant._id;
	redrawMarkers();
	map.flyTo([restaurant.lat, restaurant.lng], 14, {duration: 0.5});
	openMenuModal(restaurant._id);
};

const fetchRestaurants = async () => {
	try {
		const res = await fetch(`${BASE_API_URL}/api/v1/restaurants`);
		const data = await res.json();

		restaurants = data
			.map((restaurant) => {
				const coordinates = restaurant.location?.coordinates || [];
				const [lng, lat] = coordinates;

				return {
					...restaurant,
					lat,
					lng,
				};
			})
			.filter(
				(restaurant) =>
					Number.isFinite(restaurant.lat) &&
					Number.isFinite(restaurant.lng)
			);
	} catch (err) {
		console.error(err);
		restaurants = [];
	}
};

const initMap = async () => {
	if (!mapElement || typeof L === 'undefined') return;

	await fetchRestaurants();

	const map = L.map(mapElement, {
		zoomControl: false,
		scrollWheelZoom: true,
	}).setView(HELSINKI_CENTER, 13);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; OpenStreetMap contributors',
	}).addTo(map);

	restaurants.forEach((restaurant) => {
		const marker = L.marker([restaurant.lat, restaurant.lng], {
			icon: getMarkerIcon(false, false),
		});

		marker.on('click', () => {
			selectRestaurant(map, restaurant._id);
		});

		marker.addTo(map);
		markers[restaurant._id] = marker;
	});

	menuModalClose?.addEventListener('click', closeMenuModal);

	menuModal?.addEventListener('click', (event) => {
		if (event.target === menuModal) {
			closeMenuModal();
		}
	});

	dailyTab?.addEventListener('click', openDailyMenu);
	weeklyTab?.addEventListener('click', openWeeklyMenu);
	locateButton?.addEventListener('click', () => getUserLocation(map, true));
	zoomInButton?.addEventListener('click', () => map.zoomIn());
	zoomOutButton?.addEventListener('click', () => map.zoomOut());

	redrawMarkers();
	getUserLocation(map, false);
};

initMap();
updateHeaderAuthButton();
