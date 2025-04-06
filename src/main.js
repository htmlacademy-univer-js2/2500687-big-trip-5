import {generateMockData} from './mock/mock-data.js';
import TripModel from './model/trip-model.js';
import TripPresenter from './presenter/trip-presenter.js';

document.addEventListener('DOMContentLoaded', () => {
  const mockData = generateMockData();
  const tripModel = new TripModel(mockData);
  const tripPresenter = new TripPresenter(tripModel);
  tripPresenter.init();
});
