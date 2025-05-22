import FiltersView from '../view/filters-view.js';
import SortView from '../view/sort-view.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripListView from '../view/trip-list-view.js';
import EmptyListView from '../view/empty-list-view.js';
import PointPresenter from './point-presenter.js';
import {render, replace} from '../framework/render.js';

export default class TripPresenter {
  #model = null;
  #tripListComponent = new TripListView();
  #pointPresenters = new Map(); // Для хранения пар TripPoint и TripFormEdit
  #currentEditingPointId = null; // Для отслеживания открытой формы
  #currentFilterType = 'everything'; // Текущий фильтр
  #filtersComponent = null;
  #emptyListComponent = null;

  constructor(model) {
    this.#model = model;
    this.#filtersComponent = new FiltersView(
      this.#model.points,
      this.#currentFilterType,
      this.#handleFilterChange
    );
    this.sort = new SortView({ currentSortType: 'day', disabledSortTypes: ['event', 'offer'] });
    this.tripFormCreate = new TripFormCreate(this.#model.destinations, this.#model.offersByType);
    this.#emptyListComponent = new EmptyListView(this.#currentFilterType);
  }

  init() {
    const filtersContainer = document.querySelector('.trip-controls__filters');
    const tripEventsContainer = document.querySelector('.trip-events');

    // Отрисовка фильтров
    render(this.#filtersComponent, filtersContainer);

    //Отрисовка сортировки
    render(this.sort, tripEventsContainer);

    render(this.#tripListComponent, tripEventsContainer);

    // Отрисовка контента
    if (this.#model.points.length === 0) {
      render(this.#emptyListComponent, tripEventsContainer);
    } else {
      this.#model.points.forEach((point) => {
        this.#createPointPresenter(point);
      });
    }

    // Форма создания
    render(this.tripFormCreate, tripEventsContainer);

    document.addEventListener('keydown', this.#handleEscKeyDown);
  }

  #createPointPresenter(point) {
    const destination = this.#model.getDestinationById(point.destinationId);
    const offers = this.#model.getOffersByType(point.type).filter((offer) => point.offers.includes(offer.id));

    const pointPresenter = new PointPresenter({
      point,
      destination,
      offers,
      destinations: this.#model.destinations,
      offersByType: this.#model.offersByType,
      tripListComponent: this.#tripListComponent,
      onDataChange: this.#handlePointChange,
      onEditStart: this.#notifyPointEditStarted,
    });

    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #handlePointChange = (updatedPoint) => {
    const pointPresenter = this.#pointPresenters.get(updatedPoint.id);
    const previousSibling = pointPresenter.element?.previousElementSibling; // Сохраняем предыдущий элемент

    this.#model.updatePoint(updatedPoint.id, updatedPoint);
    pointPresenter.destroy();
    this.#pointPresenters.delete(updatedPoint.id);

    // Создаём новый презентер
    this.#createPointPresenter(updatedPoint);

    // Вставляем точку на прежнее место
    const newPresenter = this.#pointPresenters.get(updatedPoint.id);
    if (previousSibling) {
      this.#tripListComponent.element.insertBefore(newPresenter.element, previousSibling.nextSibling);
    } else {
      this.#tripListComponent.element.prepend(newPresenter.element); // Если это была первая точка
    }
  };

  #notifyPointEditStarted = (pointId) => {
    // Если уже есть открытая форма, закрываем её
    if (this.#currentEditingPointId && this.#currentEditingPointId !== pointId) {
      const previousPresenter = this.#pointPresenters.get(this.#currentEditingPointId);
      if (previousPresenter) {
        previousPresenter.resetView();
      }
    }

    // Открываем форму для текущей точки
    const currentPresenter = this.#pointPresenters.get(pointId);
    if (currentPresenter) {
      currentPresenter.switchToEditMode();
    }
    this.#currentEditingPointId = pointId;
  };

  #handleEscKeyDown = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      if (this.#currentEditingPointId) {
        const pointPresenter = this.#pointPresenters.get(this.#currentEditingPointId);
        if (pointPresenter) {
          pointPresenter.resetView(); // Переключаем в режим просмотра
        }
        this.#currentEditingPointId = null;
      }
    }
  };

  #handleFilterChange = (newFilterType) => {
    this.#currentFilterType = newFilterType;

    // Обновляем EmptyListView, если список пуст
    if (this.#model.points.length === 0) {

      const newEmptyListComponent = new EmptyListView(this.#currentFilterType);
      replace(newEmptyListComponent, this.#emptyListComponent);
      this.#emptyListComponent = newEmptyListComponent;
    }
  };
}
