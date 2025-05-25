import {generateMockData} from './mock/mock-data.js';
import TripModel from './model/trip-model.js';
import TripPresenter from './presenter/trip-presenter.js';
import FilterModel from './model/filter-model.js';
import FilterPresenter from './presenter/filter-presenter.js';


document.addEventListener('DOMContentLoaded', () => {
  const mockData = generateMockData();
  const filterModel = new FilterModel();
  const tripModel = new TripModel(mockData, filterModel);
  const tripPresenter = new TripPresenter({ model: tripModel, filterModel });
  const filtersContainer = document.querySelector('.trip-controls__filters');
  const filterPresenter = new FilterPresenter({
    container: filtersContainer, // Контейнер для фильтров
    filterModel,
    tripModel, // Передаём tripModel для получения точек
  });
  tripPresenter.init();
  filterPresenter.init(); // Инициализируем FilterPresenter
});
