// Restaurants
const BASE_API_URL = 'https://media2.edu.metropolia.fi/restaurant';

const createRestaurantCard = (r, colors) => {
	const li = document.createElement('li');
	const randomColor = colors[Math.floor(Math.random() * colors.length)];

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
					<span class="card__tag card__tag--${randomColor}">
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

		const cardList = document.querySelector('#cards-list');
		const colors = ['yellow', 'pink'];

		data.forEach((r) => {
			const li = createRestaurantCard(r, colors);
			cardList.appendChild(li);
		});
	} catch (err) {
		console.error(err);
	}
};

fetchRestaurants();

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