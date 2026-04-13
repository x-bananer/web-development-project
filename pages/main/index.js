// Restaurants
const BASE_API_URL = 'https://media2.edu.metropolia.fi/restaurant';

let allRestaurants = [];
let cities = [];
let companies = [];
let currentRestaurantId = '';

const filterSearch = document.querySelector('#filter-search');
const filterCity = document.querySelector('#filter-city');
const filterCompany = document.querySelector('#filter-company');
const filtersForm = document.querySelector('#filters');
const cardsList = document.querySelector('#cards-list');

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

    addCardEvents(li, r);

    return li;
};

const addCardEvents = (li, restaurant) => {
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
        openMenuModal(restaurant._id);
    });
};

const fetchRestaurants = async () => {
    if (cardsList) {
        cardsList.innerHTML = '<li class="list__stub">Loading....</li>';
    }

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

const searchRestaurants = ({ search = '', city = '', company = '' } = {}) => {
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
    const cardList = cardsList;

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
const menuModalTitle = document.querySelector('.modal__title');
const menuModalCaption = document.querySelector('.modal__caption');
const dailyTab = document.getElementById('daily-tab');
const weeklyTab = document.getElementById('weekly-tab');
const dailyPanel = document.getElementById('daily-panel');
const weeklyPanel = document.getElementById('weekly-panel');

let pageScrollY = 0;

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
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'];
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
        menuModalTitle.textContent = restaurant.name;
        menuModalCaption.textContent = `${restaurant.address}, ${restaurant.city}`;
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
        const res = await fetch(`${BASE_API_URL}/api/v1/restaurants/daily/${currentRestaurantId}/en`);
        const data = await res.json();
        renderDailyMenu(data.courses);
    } catch (err) {
        console.error(err);

        if (list) {
            if (title) {
                title.hidden = true;
            }
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
        const res = await fetch(`${BASE_API_URL}/api/v1/restaurants/weekly/${currentRestaurantId}/en`);
        const data = await res.json();
        renderWeeklyMenu(data.days);
    } catch (err) {
        console.error(err);
        weeklyPanel.innerHTML = `
            <div class="modal__stub">Nothing found...</div>
            ${getModalAccentMarkup()}`;
    }
};

const getModalAccentMarkup = () => `
    <div class="modal__accent">
        Dietary keys: A = allergen information available, G = gluten free, ILM = low lactose and milk free, Veg = vegan, VS = vegan suitable, L = lactose free, M = milk free, VL = low lactose. Please confirm ingredient lists with service staff for severe allergies.
    </div>`;

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

menuModalClose?.addEventListener('click', closeMenuModal);

menuModal?.addEventListener('click', (event) => {
    if (event.target === menuModal) {
        closeMenuModal();
    }
});

dailyTab?.addEventListener('click', openDailyMenu);
weeklyTab?.addEventListener('click', openWeeklyMenu);

formatMenuPrices();
