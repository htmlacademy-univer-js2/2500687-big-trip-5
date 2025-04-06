import FiltersView from '../view/filters-view.js';
import SortView from '../view/sort-view.js';
import TripFormEdit from '../view/trip-form-editor.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripPoint from '../view/trip-point.js';
import {render} from '../render.js';

export default class TripPresenter {
  #model = null;
  constructor(model) {
    this.#model = model;
    this.filters = new FiltersView();
    this.sort = new SortView();
    //this.tripFormEdit = new TripFormEdit();
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
    const firstPoint = this.#model.points[0];
    if (firstPoint) {
      const tripFormEdit = new TripFormEdit(firstPoint, this.#model.destinations, this.#model.offersByType);
      render(tripFormEdit, list);
    }

    // Отрисовка точек маршрута
    this.#model.points.forEach((point) => {
      const destination = this.#model.getDestinationById(point.destinationId);
      const offers = this.#model.getOffersByType(point.type).filter((offer) => point.offers.includes(offer.id));
      const tripPoint = new TripPoint(point, destination, offers);
      render(tripPoint, list);
    });

    // Форма создания
    render(this.tripFormCreate, list);
  }
}
