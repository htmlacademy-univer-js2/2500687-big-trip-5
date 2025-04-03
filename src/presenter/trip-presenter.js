import FiltersView from '../view/filters-view.js';
import SortView from '../view/sort-view.js';
import TripFormEdit from '../view/trip-form-editor.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripPoint from '../view/trip-point.js';
import {render} from '../render.js';

export default class TripPresenter {
  constructor() {
    this.filters = new FiltersView();
    this.sort = new SortView();
    this.tripFormEdit = new TripFormEdit();
    this.tripFormCreate = new TripFormCreate();
  }

  init() {
    const filtersContainer = document.querySelector('.trip-controls__filters');
    const tripEventsContainer = document.querySelector('.trip-events');


    // Отрисовка фильтров
    render(this.filters, filtersContainer);

    //Отрисовка сортировки
    render(this.sort, tripEventsContainer);

    // Отрисовка контента
    const list = document.createElement('ul');
    list.classList.add('trip-events__list');
    render({ getElement: () => list }, tripEventsContainer);

    // Форма редактирования
    render(this.tripFormEdit, list);

    // 3 точки маршрута
    for (let i = 0; i < 3; i++) {
      const tripPoint = new TripPoint(); // Создаём новый экземпляр для каждой точки
      render(tripPoint, list);
    }

    // Форма создания
    render(this.tripFormCreate, list);
  }
}
