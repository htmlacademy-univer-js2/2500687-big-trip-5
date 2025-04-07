import FiltersView from '../view/filters-view.js';
import SortView from '../view/sort-view.js';
import TripFormEdit from '../view/trip-form-editor.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripPoint from '../view/trip-point.js';
import TripListView from '../view/trip-list-view.js';
import {render, replace} from '../framework/render.js';

export default class TripPresenter {
  #model = null;
  #tripListComponent = new TripListView();
  #pointComponents = new Map(); // Для хранения пар TripPoint и TripFormEdit
  #currentEditingPointId = null; // Для отслеживания открытой формы

  constructor(model) {
    this.#model = model;
    this.filters = new FiltersView();
    this.sort = new SortView();
    this.tripFormCreate = new TripFormCreate(this.#model.destinations, this.#model.offersByType);
  }

  init() {
    const filtersContainer = document.querySelector('.trip-controls__filters');
    const tripEventsContainer = document.querySelector('.trip-events');

    // Отрисовка фильтров
    render(this.filters, filtersContainer);

    //Отрисовка сортировки
    render(this.sort, tripEventsContainer);

    // Отрисовка контента
    render(this.#tripListComponent, tripEventsContainer);

    // Форма редактирования
    //const firstPoint = this.#model.points[0];
    //if (firstPoint) {
    //const tripFormEdit = new TripFormEdit(firstPoint, this.#model.destinations, this.#model.offersByType);
    //render(tripFormEdit, this.#tripListComponent.element);
    //}

    // Отрисовка точек маршрута
    this.#model.points.forEach((point) => {
      this.#renderPoint(point);
    });

    // Форма создания
    render(this.tripFormCreate, this.#tripListComponent.element);

    document.addEventListener('keydown', this.#handleEscKeyDown);
  }

  #renderPoint(point) {
    const destination = this.#model.getDestinationById(point.destinationId);
    const offers = this.#model.getOffersByType(point.type).filter((offer) => point.offers.includes(offer.id));

    const tripPoint = new TripPoint(
      point,
      destination,
      offers,
      () => {
        // Обработчик для кнопки "Open event"
        const components = this.#pointComponents.get(point.id);
        replace(components.tripFormEdit, components.tripPoint);
        this.#currentEditingPointId = point.id;
      }
    );

    const tripFormEdit = new TripFormEdit(
      point,
      this.#model.destinations,
      this.#model.offersByType,
      () => {
        // Закрываем форму при submit
        const components = this.#pointComponents.get(point.id);
        replace(components.tripPoint, components.tripFormEdit);
        this.#currentEditingPointId = null; // Сбрасываем ID
      },
      () => {
        // Закрываем форму при клике на "Стрелка вверх"
        const components = this.#pointComponents.get(point.id);
        replace(components.tripPoint, components.tripFormEdit);
        this.#currentEditingPointId = null; // Сбрасываем ID
      }
    );

    this.#pointComponents.set(point.id, { tripPoint, tripFormEdit });
    render(tripPoint, this.#tripListComponent.element);
  }

  #handleEscKeyDown = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      if (this.#currentEditingPointId) {
        const components = this.#pointComponents.get(this.#currentEditingPointId);
        replace(components.tripPoint, components.tripFormEdit);
        this.#currentEditingPointId = null; // Сбрасываем ID
      }
    }
  };
}
