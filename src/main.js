import TripModel from './model/trip-model.js';
import TripPresenter from './presenter/trip-presenter.js';
import FilterModel from './model/filter-model.js';
import FilterPresenter from './presenter/filter-presenter.js';
import UiBlocker from './framework/ui-blocker/ui-blocker.js';

const TimeLimit = {
  LOWER_LIMIT: 350, // мс
  UPPER_LIMIT: 1000, // мс
};

document.addEventListener('DOMContentLoaded', async () => {
  const filterModel = new FilterModel();
  const tripModel = new TripModel(filterModel);

  const uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT,
  });

  const tripPresenter = new TripPresenter({model: tripModel, filterModel, uiBlocker});
  const filtersContainer = document.querySelector('.trip-controls__filters');
  const filterPresenter = new FilterPresenter({
    container: filtersContainer, // Контейнер для фильтров
    filterModel,
    tripModel, // Передаём tripModel для получения точек
  });
  await tripModel.init();
  filterPresenter.init(); // Инициализируем FilterPresenter
  tripPresenter.init();
});
