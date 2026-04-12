// Restaurants
const BASE_API_URL = 'https://media2.edu.metropolia.fi/restaurant';

let allRestaurants = [];
let cities = [];
let companies = [];

const filterSearch = document.querySelector('#filter-search');
const filterCity = document.querySelector('#filter-city');
const filterCompany = document.querySelector('#filter-company');
const filtersForm = document.querySelector('#filters');

const createRestaurantCard = (r) => {
	const li = document.createElement('li');

	li.classList.add('list__item');
	li.innerHTML = `
		<article class="card">
			<div class="card__media">
				<div class="card__badges">
					<span class="card__badge card__badge--blue">
						${r.city}
					</span>
				</div>
			</div>

			<div class="card__body">
				<h2 class="card__title">
					${r.name}
				</h2>
				<p class="card__address">
					${r.address}
				</p>
				<div class="card__tags">
					<span class="card__tag card__tag--${r.cardColor}">
						${r.company}
					</span>
				</div>
			</div>

			<button class="button button--square button--icon card__favorite-button" type="button">
				♥
			</button>

			<button class="button button--card card__unpin-button" type="button">
				UNPIN
			</button>
		</article>`;

	addCardEvents(li);

	return li;
};

const addCardEvents = (li) => {
	const card = li.querySelector('.card');
	const favoriteButton = li.querySelector('.card__favorite-button');
	const unpinButton = li.querySelector('.card__unpin-button');

	favoriteButton?.addEventListener('click', (event) => {
		event.stopPropagation();

		const list = li.parentElement;

		document.querySelectorAll('.card.card--favorite').forEach((activeCard) => {
			if (activeCard !== card) {
				activeCard.classList.remove('card--favorite');
			}
		});

		card.classList.add('card--favorite');

		if (list?.firstElementChild !== li) {
			list.prepend(li);
		}
	});

	unpinButton?.addEventListener('click', (event) => {
		event.stopPropagation();
		card.classList.remove('card--favorite');
	});

	card.addEventListener('click', () => {
		openMenuModal();
	});
};

const fetchRestaurants = async () => {
	try {
		const res = await fetch(`${BASE_API_URL}/api/v1/restaurants`);
		const data = await res.json();
		const colors = ['yellow', 'pink'];

		allRestaurants = data.map((restaurant) => ({
			...restaurant,
			cardColor: colors[Math.floor(Math.random() * colors.length)],
		}));

		cities = [...new Set(allRestaurants.map((restaurant) => restaurant.city))].sort();
		companies = [...new Set(allRestaurants.map((restaurant) => restaurant.company))].sort();

		cities.forEach((city) => {
			const option = document.createElement('option');
			option.value = city;
			option.textContent = city;
			filterCity?.appendChild(option);
		});

		companies.forEach((company) => {
			const option = document.createElement('option');
			option.value = company;
			option.textContent = company;
			filterCompany?.appendChild(option);
		});

		updateRestaurantList();
	} catch (err) {
		console.error(err);
	}
};

const searchRestaurants = ({search = '', city = '', company = ''} = {}) => {
	const normalizedSearch = search.trim().toLowerCase();

	return allRestaurants.filter((restaurant) => {
		let matchesSearch = true;

		if (normalizedSearch) {
			const name = restaurant.name.toLowerCase();
			const address = restaurant.address.toLowerCase();
			const restaurantCity = restaurant.city.toLowerCase();
			const restaurantCompany = restaurant.company.toLowerCase();

			matchesSearch =
				name.includes(normalizedSearch) ||
				address.includes(normalizedSearch) ||
				restaurantCity.includes(normalizedSearch) ||
				restaurantCompany.includes(normalizedSearch);
		}

		const matchesCity = !city || restaurant.city === city;
		const matchesCompany = !company || restaurant.company === company;

		return matchesSearch && matchesCity && matchesCompany;
	});
};

const updateRestaurantList = () => {
	const filteredRestaurants = searchRestaurants({
		search: filterSearch?.value || '',
		city: filterCity?.value || '',
		company: filterCompany?.value || '',
	});
	const cardList = document.querySelector('#cards-list');

	if (!cardList) return;

	cardList.innerHTML = '';

	if (filteredRestaurants.length === 0) {
		cardList.innerHTML = '<li class="list__stub">Nothing found...</li>';
		return;
	}

	filteredRestaurants.forEach((restaurant) => {
		const li = createRestaurantCard(restaurant);
		cardList.appendChild(li);
	});
};

fetchRestaurants();

filterSearch?.addEventListener('input', updateRestaurantList);
filterCity?.addEventListener('change', updateRestaurantList);
filterCompany?.addEventListener('change', updateRestaurantList);
filtersForm?.addEventListener('reset', () => {
	setTimeout(updateRestaurantList, 0);
});

// Modal
const menuModal = document.getElementById('modal');
const menuModalClose = document.getElementById('modal-close');
const dailyTab = document.getElementById('daily-tab');
const weeklyTab = document.getElementById('weekly-tab');
const dailyPanel = document.getElementById('daily-panel');
const weeklyPanel = document.getElementById('weekly-panel');
const menuPrices = document.querySelectorAll('.modal__price');

let pageScrollY = 0;

const formatMenuPrices = () => {
	menuPrices.forEach((price) => {
		const parts = price.textContent
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length < 2) return;

		price.innerHTML = parts.map((part) => `<span>${part}</span>`).join('');
	});
};

const openMenuModal = () => {
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
	document.body.classList.remove('disable-scroll');
	document.body.style.top = '';
	menuModal?.classList.remove('is-open');

	window.scrollTo(0, pageScrollY);
};

const openDailyMenu = () => {
	dailyTab?.classList.add('modal__tab--active');
	weeklyTab?.classList.remove('modal__tab--active');

	dailyPanel?.classList.add('modal__panel--active');
	weeklyPanel?.classList.remove('modal__panel--active');

	dailyPanel?.scrollTo(0, 0);
};

const openWeeklyMenu = () => {
	weeklyTab?.classList.add('modal__tab--active');
	dailyTab?.classList.remove('modal__tab--active');

	weeklyPanel?.classList.add('modal__panel--active');
	dailyPanel?.classList.remove('modal__panel--active');

	weeklyPanel?.scrollTo(0, 0);
};

menuModalClose?.addEventListener('click', closeMenuModal);

menuModal?.addEventListener('click', (event) => {
	if (event.target === menuModal) {
		closeMenuModal();
	}
});

dailyTab?.addEventListener('click', openDailyMenu);
weeklyTab?.addEventListener('click', openWeeklyMenu);

formatMenuPrices();
