import {generateTripPoint} from './generate-trip-point.js';
import {generateDestination} from './generate-destination.js';
import {OFFERS_BY_TYPE} from './offers.js';

export const generateMockData = () => {
  const destinations = [];
  const points = [];

  for (let i = 1; i <= 3; i++) {
    destinations.push(generateDestination(i));
  }

  for (let i = 1; i <= 3; i++) {
    points.push(generateTripPoint(i, OFFERS_BY_TYPE));
  }

  return {
    points,
    destinations,
    offersByType: OFFERS_BY_TYPE
  };
};
