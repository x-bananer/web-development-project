// const apiBaseUrl = 'https://media2.edu.metropolia.fi/restaurant/api/v1';
// const restaurantId = '6470d38ecb12107db6fe24c8';
// const menuLanguage = 'en';

// const parseResponseBody = async (response) => {
// 	const contentType = response.headers.get('content-type') || '';

// 	if (contentType.includes('application/json')) {
// 		return response.json();
// 	}

// 	return response.text();
// };

// const debugRestaurantApi = async () => {
// 	try {
// 		const restaurantsResponse = await fetch(`${apiBaseUrl}/restaurants`);
// 		const restaurantsData = await parseResponseBody(restaurantsResponse);

// 		console.log('GET /restaurants', {
// 			status: restaurantsResponse.status,
// 			ok: restaurantsResponse.ok,
// 			data: restaurantsData,
// 		});

// 		const dailyMenuResponse = await fetch(
// 			`${apiBaseUrl}/restaurants/daily/${restaurantId}/${menuLanguage}`
// 		);
// 		const dailyMenuData = await parseResponseBody(dailyMenuResponse);

// 		console.log('GET /restaurants/daily/:id/:lang', {
// 			status: dailyMenuResponse.status,
// 			ok: dailyMenuResponse.ok,
// 			data: dailyMenuData,
// 		});

// 		const weeklyMenuResponse = await fetch(
// 			`${apiBaseUrl}/restaurants/weekly/${restaurantId}/${menuLanguage}`
// 		);
// 		const weeklyMenuData = await parseResponseBody(weeklyMenuResponse);

// 		console.log('GET /restaurants/weekly/:id/:lang', {
// 			status: weeklyMenuResponse.status,
// 			ok: weeklyMenuResponse.ok,
// 			data: weeklyMenuData,
// 		});
// 	} catch (error) {
// 		console.error('Restaurant API debug failed', error);
// 	}
// };

// document.addEventListener('DOMContentLoaded', async () => {
// 	await debugRestaurantApi();
// });
