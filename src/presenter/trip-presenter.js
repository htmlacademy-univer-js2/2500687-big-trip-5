import SortView from '../view/sort-view.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripListView from '../view/trip-list-view.js';
import EmptyListView from '../view/empty-list-view.js';
import PointPresenter from './point-presenter.js';
import {render, replace, remove} from '../framework/render.js';

const ActionType = {
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ADD: 'ADD',
};

export default class TripPresenter {
  #model = null;
  #filterModel = null;
  #tripListComponent = new TripListView();
  #pointPresenters = new Map(); // Для хранения пар TripPoint и TripFormEdit
  #currentEditingPointId = null; // Для отслеживания открытой формы
  #currentFilterType = 'everything'; // Текущий фильтр
  #currentSortType = 'day'; // Текущий тип сортировки
  #emptyListComponent = null;
  #sortComponent = null;


  constructor({model, filterModel}) {
    this.#model = model;
    this.#filterModel = filterModel;
    this.#currentFilterType = this.#filterModel.getFilter();

    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: ['event', 'offer'],
      onSortTypeChange: this.#handleSortTypeChange, // Передаём колбэк
    });

    this.tripFormCreate = new TripFormCreate(
      this.#model.destinations,
      this.#model.offersByType,
      this.#handleNewPointSubmit, // Добавляем обработчик отправки формы
      this.#handleNewPointCancel // Добавляем обработчик отмены
    );

    this.#emptyListComponent = new EmptyListView(this.#currentFilterType);
    // Подписываемся на изменения в моделях
    this.#filterModel.addObserver(this.#handleModelEvent.bind(this));
    this.#model.addObserver(this.#handleModelEvent.bind(this));
  }

  init() {
    const tripEventsContainer = document.querySelector('.trip-events');

    //Отрисовка сортировки
    render(this.#sortComponent, tripEventsContainer);

    render(this.#tripListComponent, tripEventsContainer);

    // Отрисовка контента
    this.#renderTrip();

    document.addEventListener('keydown', this.#handleEscKeyDown);

    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    newEventButton.addEventListener('click', this.#handleNewEventClick);
  }

  #renderTrip() {
    // Очищаем текущие презентеры
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    // Удаляем старую заглушку, если она есть
    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }

    // Получаем отфильтрованные точки
    const points = this.#sortPoints(this.#model.points);

    // Если точек нет, показываем заглушку
    if (points.length === 0) {
      this.#emptyListComponent = new EmptyListView(this.#currentFilterType);
      render(this.#emptyListComponent, this.#tripListComponent.element);
      return;
    }

    // Отрисовываем точки
    points.forEach((point) => {
      this.#createPointPresenter(point);
    });
  }

  #sortPoints(points) {
    const pointsCopy = [...points];
    switch (this.#currentSortType) {
      case 'day':
        return pointsCopy.sort((a, b) => {
          const dateA = new Date(a.dateFrom);
          const dateB = new Date(b.dateFrom);
          return dateA - dateB || a.id - b.id; // Если даты совпадают, сортируем по ID
        });
      case 'time':
        return pointsCopy.sort((a, b) => {
          const durationA = new Date(a.dateTo) - new Date(a.dateFrom);
          const durationB = new Date(b.dateTo) - new Date(b.dateFrom);
          return durationB - durationA; // Сортируем от большего времени к меньшему
        });
      case 'price':
        return pointsCopy.sort((a, b) => b.basePrice - a.basePrice); // Сортируем от большей цены к меньшей
      default:
        return pointsCopy;
    }
  }

  #handleSortTypeChange = (newSortType) => {
    if (this.#currentSortType === newSortType) {
      return; // Не перерисовываем, если тип сортировки не изменился
    }

    this.#currentSortType = newSortType;

    // Обновляем SortView с новым типом сортировки
    const newSortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: ['event', 'offer'],
      onSortTypeChange: this.#handleSortTypeChange,
    });
    replace(newSortComponent, this.#sortComponent);
    this.#sortComponent = newSortComponent;

    // Перерисовываем точки с новым порядком
    this.#renderTrip();
  };

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

  #handlePointChange = async (actionType, updatedPoint) => {
    switch (actionType) {
      case ActionType.UPDATE:
        this.#model.updatePoint(updatedPoint.id, updatedPoint);
        break;
      case ActionType.DELETE:
        await this.#model.deletePoint(updatedPoint.id);
        break;
      case ActionType.ADD:
        this.#model.addPoint(updatedPoint);
        break;
    }
  };

  #notifyPointEditStarted = (pointId) => {
    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = false;
    }

    // Закрываем форму создания, если она открыта
    if (this.tripFormCreate.element && this.tripFormCreate.element.parentElement) {
      this.tripFormCreate.element.remove();
      // Пересоздаём форму создания, чтобы сбросить её состояние
      this.tripFormCreate = new TripFormCreate(
        this.#model.destinations,
        this.#model.offersByType,
        this.#handleNewPointSubmit,
        this.#handleNewPointCancel
      );
    }

    // Закрываем все формы редактирования
    this.#pointPresenters.forEach((presenter) => {
      //if (id !== pointId && presenter.isEditing) {
      presenter.resetFormToInitialState();
      presenter.resetView();
      //}
    });

    // Открываем новую форму редактирования
    const currentPresenter = this.#pointPresenters.get(pointId);
    if (currentPresenter) {
      currentPresenter.switchToEditMode();
      this.#currentEditingPointId = pointId;
    } else {
      this.#currentEditingPointId = null;
    }
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
      remove(this.tripFormCreate);
      document.querySelector('.trip-main__event-add-btn').disabled = false;
    }
  };

  #handleModelEvent = () => {
    this.#currentFilterType = this.#filterModel.getFilter();
    //this.#currentSortType = 'day';

    const newSortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: ['event', 'offer'],
      onSortTypeChange: this.#handleSortTypeChange.bind(this),
    });
    replace(newSortComponent, this.#sortComponent);
    this.#sortComponent = newSortComponent;

    this.#renderTrip();
  };

  #handleNewEventClick = () => {
  // Сбрасываем фильтры и сортировку
    this.#currentFilterType = 'everything';
    this.#currentSortType = 'day';
    this.#filterModel.setFilter(this.#currentFilterType);

    // Закрываем все открытые формы редактирования
    if (this.#currentEditingPointId) {
      const previousPresenter = this.#pointPresenters.get(this.#currentEditingPointId);
      if (previousPresenter) {
        previousPresenter.resetFormToInitialState();
        previousPresenter.resetView();
      }
      this.#currentEditingPointId = null;
    }

    // Удаляем и пересоздаём форму создания
    if (this.tripFormCreate.element && this.tripFormCreate.element.parentElement) {
      this.tripFormCreate.element.remove();
    }
    this.tripFormCreate = new TripFormCreate(
      this.#model.destinations,
      this.#model.offersByType,
      this.#handleNewPointSubmit,
      this.#handleNewPointCancel
    );

    // Блокируем кнопку "New Event"
    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = true;
    }

    // Добавляем форму создания в начало списка
    const tripList = document.querySelector('.trip-events__list');
    if (tripList) {
      render(this.tripFormCreate, tripList, 'afterbegin');
    } else {
      render(this.tripFormCreate, document.querySelector('.trip-events'));
    }
  };

  #handleNewPointSubmit = (newPoint) => {
    this.#handlePointChange(ActionType.ADD, newPoint);
    this.tripFormCreate.element.remove();
    this.tripFormCreate = new TripFormCreate(
      this.#model.destinations,
      this.#model.offersByType,
      this.#handleNewPointSubmit,
      this.#handleNewPointCancel
    );
    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = false;
    }
    this.#currentEditingPointId = null; // Сбрасываем текущую редактируемую точку
  };

  #handleNewPointCancel = () => {
    this.tripFormCreate.element.remove();
    this.tripFormCreate = new TripFormCreate(
      this.#model.destinations,
      this.#model.offersByType,
      this.#handleNewPointSubmit,
      this.#handleNewPointCancel
    );
    const newEventButton = document.querySelector('.trip-main__event-add-btn');
    if (newEventButton) {
      newEventButton.disabled = false;
    }
    this.#currentEditingPointId = null; // Сбрасываем текущую редактируемую точку
  };
}
