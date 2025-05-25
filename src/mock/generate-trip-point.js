import {getRandomInt, getRandomArrayElement} from './utils';

const TYPES = ['Taxi', 'Bus', 'Train', 'Ship', 'Drive', 'Flight', 'Check-in', 'Sightseeing', 'Restaurant'];

export const generateTripPoint = (id, offersByType) => {
  const type = getRandomArrayElement(TYPES);

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() + getRandomInt(-5, 5));
  dateFrom.setHours(getRandomInt(0, 23), getRandomInt(0, 59));
  const dateTo = new Date(dateFrom);
  dateTo.setHours(dateTo.getHours() + getRandomInt(1, 48));

  const availableOffers = offersByType[type] || [];
  const selectedOffers = availableOffers
    .filter(() => Math.random() > 0.5)
    .map((offer) => offer.id); // Осталвяем случайные дополнительные опции

  return {
    id: String(id),
    type: type,
    destinationId: getRandomInt(1, 3),
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    basePrice: getRandomInt(50, 200),
    offers: selectedOffers,
    isFavorite: Math.random() > 0.5
  };
};
