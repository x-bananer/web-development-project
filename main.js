/* global L */

const HELSINKI_CENTER = [60.1699, 24.9384];
const scriptUrl = new URL(import.meta.url);
const placesUrl = new URL('./assets/data/places.json', scriptUrl);
const pinIconUrl = new URL('./assets/icons/pin.svg', scriptUrl);

document.addEventListener('DOMContentLoaded', async () => {
	const mapElement = document.getElementById('map');

	if (!mapElement || typeof L === 'undefined') {
		return;
	}

	let places = [];

	try {
		const response = await fetch(placesUrl);
		places = await response.json();
	} catch {
		return;
	}

	const panel = document.getElementById('map-card');
	const closeButton = document.getElementById('map-close');
	const locateButton = document.getElementById('map-locate');
	const zoomInButton = document.getElementById('map-zoom-in');
	const zoomOutButton = document.getElementById('map-zoom-out');

	const map = L.map(mapElement, {
		zoomControl: false,
		scrollWheelZoom: true,
	}).setView(HELSINKI_CENTER, 13);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; OpenStreetMap contributors',
	}).addTo(map);

	let activePlaceId = '';
	let userMarker = null;
	const markers = {};

	const getMarkerIcon = (isActive) => {
		const color = isActive ? 'yellow' : 'pink';
		const label = isActive
			? '<span class="map__marker-label">Near you</span>'
			: '';

		return L.divIcon({
			className: '',
			html: `
				<div class="map__marker map__marker--${color}">
					${label}
					<img class="map__marker-icon" src="${pinIconUrl}" alt="" />
				</div>
			`,
			iconSize: [48, 48],
			iconAnchor: [20, 44],
		});
	};

	const updateCard = (place) => {
		if (!panel) {
			return;
		}

		const title = document.getElementById('map-title');
		const address = document.getElementById('map-address');
		const tags = document.getElementById('map-tags');
		const link = document.getElementById('map-link');
		const media = panel.querySelector('.card__media');
		const badges = panel.querySelectorAll('.card__badge');

		if (!title || !address || !media || !tags || !link) {
			return;
		}

		title.textContent = place.name;
		address.textContent = place.address;
		media.className = 'card__media';

		if (badges[0]) {
			badges[0].textContent = place.city;
		}

		if (badges[1]) {
			badges[1].textContent = place.provider;
			badges[1].className =
				place.provider === 'Sodexo'
					? 'card__badge card__badge--blue'
					: 'card__badge card__badge--pink';
		}

		tags.innerHTML = '';

		for (const color of place.tags || []) {
			const tag = document.createElement('span');
			tag.className = `card__tag card__tag--${color}`;
			tags.append(tag);
		}

		link.href = place.link;
	};

	const redrawMarkers = () => {
		for (const place of places) {
			const marker = markers[place.id];

			if (marker) {
				marker.setIcon(getMarkerIcon(place.id === activePlaceId));
			}
		}
	};

	const openCard = () => {
		if (panel) {
			panel.classList.add('is-open');
		}
	};

	const closeCard = () => {
		if (panel) {
			panel.classList.remove('is-open');
		}
	};

	const selectPlace = (placeId) => {
		let place = places[0];

		for (const item of places) {
			if (item.id === placeId) {
				place = item;
			}
		}

		activePlaceId = place.id;
		updateCard(place);
		redrawMarkers();
		map.flyTo([place.lat, place.lng], 14, {duration: 0.5});
		openCard();
	};

	const setUserLocation = (lat, lng) => {
		if (userMarker) {
			userMarker.setLatLng([lat, lng]);
			return;
		}

		userMarker = L.marker([lat, lng], {
			icon: L.divIcon({
				className: '',
				html: '<div class="map__user-marker"></div>',
				iconSize: [28, 28],
				iconAnchor: [14, 14],
			}),
		}).addTo(map);
	};

	const findNearestPlace = (lat, lng) => {
		let nearestPlace = places[0];
		let nearestDistance = Infinity;

		for (const place of places) {
			const lat1 = (lat * Math.PI) / 180;
			const lng1 = (lng * Math.PI) / 180;
			const lat2 = (place.lat * Math.PI) / 180;
			const lng2 = (place.lng * Math.PI) / 180;
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
				nearestPlace = place;
			}
		}

		return nearestPlace;
	};

	const showNearestPlace = (lat, lng, moveSmoothly) => {
		const nearestPlace = findNearestPlace(lat, lng);

		activePlaceId = nearestPlace.id;
		redrawMarkers();

		if (moveSmoothly) {
			map.flyTo([lat, lng], 15, {duration: 0.5});
		} else {
			map.setView([lat, lng], 15);
		}
	};

	const getUserLocation = (moveSmoothly) => {
		if (!navigator.geolocation) {
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;

				setUserLocation(lat, lng);
				showNearestPlace(lat, lng, moveSmoothly);
			},
			() => {},
			{
				enableHighAccuracy: true,
				timeout: 10000,
			}
		);
	};

	for (const place of places) {
		const marker = L.marker([place.lat, place.lng], {
			icon: getMarkerIcon(false),
		});

		marker.on('click', () => {
			selectPlace(place.id);
		});

		marker.addTo(map);
		markers[place.id] = marker;
	}

	closeButton?.addEventListener('click', () => {
		closeCard();
	});

	locateButton?.addEventListener('click', () => {
		getUserLocation(true);
	});

	zoomInButton?.addEventListener('click', () => {
		map.zoomIn();
	});

	zoomOutButton?.addEventListener('click', () => {
		map.zoomOut();
	});

	if (navigator.permissions) {
		navigator.permissions.query({name: 'geolocation'}).then((result) => {
			if (result.state === 'granted') {
				getUserLocation(false);
			}
		});
	}

	redrawMarkers();
	closeCard();
});
