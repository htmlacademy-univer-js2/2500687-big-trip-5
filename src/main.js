import TripModel from './model/trip-model.js';
import TripPresenter from './presenter/trip-presenter.js';
import FilterModel from './model/filter-model.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import UiBlocker from './framework/ui-blocker/ui-blocker.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

document.addEventListener('DOMContentLoaded', async () => {
  const filterModel = new FilterModel();
  const tripModel = new TripModel(filterModel);

  const uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT,
  });
  const tripMainContainer = document.querySelector('.trip-main');
  const tripPresenter = new TripPresenter({model: tripModel, filterModel, uiBlocker});
  const filtersContainer = document.querySelector('.trip-controls__filters');

  const tripInfoPresenter = new TripInfoPresenter({
    container: tripMainContainer,
    tripModel
  });

  const filterPresenter = new FilterPresenter({
    container: filtersContainer,
    filterModel,
    tripModel,
  });
  tripPresenter.init();
  filterPresenter.init();
  await tripModel.init();
  tripInfoPresenter.init();
});
