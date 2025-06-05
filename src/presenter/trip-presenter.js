import SortView from '../view/sort-view.js';
import TripFormCreate from '../view/trip-form-creation.js';
import TripListView from '../view/trip-list-view.js';
import EmptyListView from '../view/empty-list-view.js'; // Для сообщений "нет точек" и "ошибка загрузки"
import PointPresenter from './point-presenter.js';
import LoadingView from '../view/loading-view.js'; // Для сообщения "Loading..."
import {render, replace, remove} from '../framework/render.js';
import dayjs from 'dayjs';

// Типы обновлений, которые модель может отправить презентеру
const UpdateType = {
  PATCH: 'PATCH', // Небольшое обновление одной точки (например, isFavorite)
  MINOR: 'MINOR', // Обновление, требующее перерисовки списка (добавление, удаление, крупное изменение точки)
  MAJOR: 'MAJOR', // Обновление, требующее полной перерисовки доски (смена фильтра)
  INIT: 'INIT', // Инициализация модели (успех или ошибка)
};

// Типы сортировки
const SortType = {
  DAY: 'day',
  EVENT: 'event',
  TIME: 'time',
  PRICE: 'price',
  OFFER: 'offer',
};

// Типы фильтров
const FilterType = {
  EVERYTHING: 'everything',
  PAST: 'past',
  PRESENT: 'present',
  FUTURE: 'future',
};

// Уникальный идентификатор для отслеживания открытой формы создания
const NEW_POINT_FORM_ID = 'new-point-form';

export default class TripPresenter {
  // Модели
  #model = null;
  #filterModel = null;

  // View компоненты основной структуры
  #tripListComponent = new TripListView(); // Контейнер <ul> для точек
  #sortComponent = null; // Компонент сортировки
  #emptyListComponent = null; // Компонент для сообщений (нет точек, ошибка)
  #loadingComponent = null; // Компонент для сообщения "Loading..."

  // Управление точками и формой создания
  #pointPresenters = new Map(); // Коллекция презентеров отдельных точек (ключ - id точки)
  #tripFormCreate = null; // Экземпляр формы создания новой точки
  #currentEditingPointId = null; // ID точки, которая сейчас редактируется

  // Элементы DOM и состояние UI
  #newEventButton = null; // Кнопка "New Event"
  #tripEventsContainer = null; // DOM-контейнер для всего списка событий (включая сортировку)
  #uiBlocker = null; // Экземпляр UiBlocker для блокировки интерфейса
  #isLoading = true; // Флаг: идет ли начальная загрузка данных
  #currentSortType = SortType.DAY; // Текущий активный тип сортировки

  constructor({model, filterModel, uiBlocker}) {
    this.#model = model;
    this.#filterModel = filterModel;
    this.#uiBlocker = uiBlocker;

    // Получаем ссылки на DOM-элементы один раз
    this.#newEventButton = document.querySelector('.trip-main__event-add-btn');
    this.#tripEventsContainer = document.querySelector('.trip-events');

    // Подписываемся на события моделей
    this.#model.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleFilterChange);
  }

  init() {
    // Слушатель на кнопку "New Event"
    this.#newEventButton.addEventListener('click', this.#handleNewEventClick);
  }

  // Основной метод рендеринга "доски" (сортировка, список точек или сообщения)
  #renderBoard() {
    if (this.#isLoading) {
      this.#renderLoading(); // Если идет загрузка, показываем сообщение "Loading..."
      return;
    }

    const points = this.#getSortedPoints(); // Получаем отфильтрованные и отсортированные точки
    const currentFilterType = this.#filterModel.getFilter();

    // Рендеринг или обновление компонента сортировки
    const prevSortComponent = this.#sortComponent;
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: [SortType.EVENT, SortType.OFFER], // Типы сортировки, которые отключены
      onSortTypeChange: this.#handleSortTypeChange,
    });

    if (prevSortComponent) {
      replace(this.#sortComponent, prevSortComponent);
    } else {
      render(this.#sortComponent, this.#tripEventsContainer, 'afterbegin');
    }

    // Рендеринг списка точек или сообщения о его пустоте
    // Сначала удаляем старое сообщение о пустом списке, если оно было
    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }

    // Если точек нет И не открыта форма создания, показываем сообщение для текущего фильтра
    if (points.length === 0 && !this.#tripFormCreate) {
      this.#renderEmptyList(currentFilterType);
      // Если показываем EmptyList, сам контейнер <ul> для точек не нужен
      if (this.#tripListComponent.element.parentElement) {
        remove(this.#tripListComponent);
      }
      return;
    }

    render(this.#tripListComponent, this.#tripEventsContainer);
    // Рендерим сами точки
    this.#renderPoints(points);
  }

  // Показывает сообщение "Loading..."
  #renderLoading() {
    this.#removeNonBoardStaticMessages(); // Удаляем другие сообщения (пустой список, ошибка)
    this.#loadingComponent = new LoadingView();
    render(this.#loadingComponent, this.#tripEventsContainer);
    // Во время загрузки не должно быть сортировки и списка
    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }
    if (this.#tripListComponent.element.parentElement) {
      remove(this.#tripListComponent);
    }
  }

  // Показывает сообщение об ошибке загрузки данных
  #renderErrorMessage() {
    this.#removeNonBoardStaticMessages(); // Удаляем другие сообщения
    this.#emptyListComponent = new EmptyListView('error-load'); // Специальный тип для сообщения об ошибке
    render(this.#emptyListComponent, this.#tripEventsContainer);
    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }
    // Не удаляем TripListComponent, если точки уже загружены
    if (this.#tripListComponent.element.parentElement) {
      remove(this.#tripListComponent);
    }
  }


  // Показывает сообщение о том, что нет точек по текущему фильтру
  #renderEmptyList (filterType) {
    this.#removeNonBoardStaticMessages(); // Удаляем другие сообщения
    this.#emptyListComponent = new EmptyListView(filterType);
    render(this.#emptyListComponent, this.#tripEventsContainer);
    if (this.#tripListComponent.element.parentElement) {
      remove(this.#tripListComponent);
    }
  }

  // Удаляет все статические сообщения (Loading, Empty, Error)
  #removeNonBoardStaticMessages() {
    if (this.#loadingComponent) {
      remove(this.#loadingComponent);
      this.#loadingComponent = null;
    }
    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }
  }

  // Получает точки из модели и сортирует их согласно #currentSortType
  #getSortedPoints() {
    let points = [...this.#model.points];
    const currentFilterType = this.#filterModel.getFilter();
    const now = dayjs();

    // Применяем фильтр
    switch (currentFilterType) {
      case FilterType.EVERYTHING:
        break;
      case FilterType.PAST:
        points = points.filter((point) => dayjs(point.dateTo).isBefore(now));
        break;
      case FilterType.PRESENT:
        points = points.filter((point) =>
          dayjs(point.dateFrom) <= now && now <= dayjs(point.dateTo)
        );
        break;
      case FilterType.FUTURE:
        points = points.filter((point) => dayjs(point.dateFrom).isAfter(now));
        break;
    }

    // Применяем сортировку
    switch (this.#currentSortType) {
      case SortType.DAY:
        return points.sort((a, b) => dayjs(a.dateFrom).diff(dayjs(b.dateFrom)));
      case SortType.TIME:
        return points.sort((a, b) =>
          (dayjs(b.dateTo).diff(dayjs(b.dateFrom))) - (dayjs(a.dateTo).diff(dayjs(a.dateFrom)))
        );
      case SortType.PRICE:
        return points.sort((a, b) => b.basePrice - a.basePrice);
    }
    return points;
  }

  // Очищает список от всех презентеров точек
  #clearPointList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
    // Сообщение о пустом списке удаляется в #renderBoard или #renderEmptyList
  }

  // Рендерит презентеры для каждой точки
  #renderPoints(points) {
    points.forEach((point) => this.#createPointPresenter(point));
  }

  // Создает и сохраняет презентер для одной точки
  #createPointPresenter(point) {
    // Если для этой точки уже есть презентер (например, при PATCH обновлении), уничтожаем старый
    if (this.#pointPresenters.has(point.id)) {
      this.#pointPresenters.get(point.id).destroy();
    }

    const pointPresenter = new PointPresenter({
      point,
      destinations: this.#model.destinations, // Передаем все destinations
      offersByType: this.#model.offersByType, // Передаем все offersByType
      tripListComponent: this.#tripListComponent,
      onEditStart: this.#handleEditStart, // Колбэк для закрытия других форм
      tripModel: this.#model, // Ссылка на модель данных
      uiBlocker: this.#uiBlocker, // Ссылка на блокировщик UI
    });
    pointPresenter.render(); // Запускаем рендеринг точки через ее презентер
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  // Обработчик смены типа сортировки
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
    this.#renderBoard();
  };

  // Обработчик начала редактирования точки (или открытия формы создания)
  #handleEditStart = (pointIdBeingEdited) => {
    // Закрываем предыдущую открытую форму редактирования, если это другая точка
    if (this.#currentEditingPointId && this.#currentEditingPointId !== pointIdBeingEdited && this.#currentEditingPointId !== NEW_POINT_FORM_ID) {
      this.#pointPresenters.get(this.#currentEditingPointId)?.resetView();
    }
    // Закрываем форму создания, если открывается форма редактирования существующей точки
    if (pointIdBeingEdited !== NEW_POINT_FORM_ID && this.#tripFormCreate) {
      this.#closeCreateForm(false); // false - не рендерить сообщение о пустом списке, т.к. открывается другая форма
    }

    this.#currentEditingPointId = pointIdBeingEdited;
  };

  // Обработчик нажатия Esc на документе
  #handleDocumentEscKeyDown = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      if (this.#currentEditingPointId === NEW_POINT_FORM_ID && this.#tripFormCreate) {
        this.#handleNewPointCancel(); // Используем стандартный обработчик отмены для формы создания
      } else if (this.#currentEditingPointId) { // Если открыта форма редактирования
        const presenter = this.#pointPresenters.get(this.#currentEditingPointId);
        presenter?.resetView(); // PointPresenter сам сбросит форму и вызовет #onEditStart(null)
        // Но мы дополнительно сбрасываем здесь для надежности
        this.#currentEditingPointId = null; // Сбрасываем ID редактируемой точки
        this.#newEventButton.disabled = false; // Разблокируем кнопку "New Event"
      }
    }
  };

  #handleFilterChange = () => {
    this.#currentSortType = SortType.DAY;
    this.#clearPointList();
    this.#renderBoard();
  };

  // Обработчик событий от моделей (TripModel, FilterModel)
  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        if (this.#pointPresenters.has(data.id)) {
          this.#pointPresenters.get(data.id).updatePoint(data);
        }
        break;
      case UpdateType.MINOR: // Существенное изменение точки, добавление, удаление
        this.#clearPointList(); // Очищаем старые презентеры
        this.#renderBoard(); // Перерисовываем всю доску
        break;
      case UpdateType.MAJOR: // Смена фильтра (требует полной перерисовки и сброса сортировки)
        this.#currentSortType = SortType.DAY; // Сброс сортировки на "по дням"
        this.#clearPointList();
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        this.#removeNonBoardStaticMessages();
        if (data && data.error) {
          this.#renderErrorMessage();
        } else {
          this.#renderBoard();
          document.addEventListener('keydown', this.#handleDocumentEscKeyDown);
        }
        break;
    }
  };

  // Обработчик клика по кнопке "New Event"
  #handleNewEventClick = () => {
    // ТЗ: сброс фильтра и сортировки
    let needsFullReRender = false;
    if (this.#filterModel.getFilter() !== FilterType.EVERYTHING) {
      this.#filterModel.setFilter(FilterType.EVERYTHING); // Это вызовет UpdateType.MAJOR и перерисовку
      needsFullReRender = true; // FilterModel сама вызовет перерисовку
    }
    if (this.#currentSortType !== SortType.DAY) {
      this.#currentSortType = SortType.DAY;
      if (!needsFullReRender) { // Если смена фильтра не вызвала перерисовку, делаем ее для сортировки
        this.#clearPointList();
        this.#renderBoard();
      }
    }

    // Закрыть открытую форму редактирования
    if (this.#currentEditingPointId && this.#currentEditingPointId !== NEW_POINT_FORM_ID) {
      this.#pointPresenters.get(this.#currentEditingPointId)?.resetView();
    }
    // Если форма создания уже была открыта, закрываем ее для сброса состояния
    if (this.#tripFormCreate) {
      this.#closeCreateForm(false); // false - не рендерить пустой список, если есть другие точки
    }

    // Удаляем сообщение "Loading/Error/Empty", если оно было
    this.#removeNonBoardStaticMessages();

    // Создаем и рендерим форму создания
    this.#tripFormCreate = new TripFormCreate(
      this.#model.destinations,
      this.#model.offersByType,
      this.#handleNewPointSave, // Колбэк на сохранение
      this.#handleNewPointCancel // Колбэк на отмену
    );

    // Убеждаемся, что <ul> для точек есть в DOM
    if (!this.#tripListComponent.element.parentElement) {
      render(this.#tripListComponent, this.#tripEventsContainer);
    }

    render(this.#tripFormCreate, this.#tripListComponent.element, 'afterbegin'); // Вставляем форму в начало списка
    this.#currentEditingPointId = NEW_POINT_FORM_ID; // Устанавливаем флаг открытой формы создания
    this.#newEventButton.disabled = true; // Блокируем кнопку "New Event"
  };

  // Закрывает форму создания новой точки
  #closeCreateForm(renderEmptyIfNeeded = true) {
    if (this.#tripFormCreate) {
      remove(this.#tripFormCreate);
      this.#tripFormCreate = null;
      this.#currentEditingPointId = null;
      this.#newEventButton.disabled = false;

      // Если после закрытия формы создания список точек пуст (и не было ошибки загрузки, и не идет загрузка)
      // показываем сообщение о пустом списке для текущего фильтра.
      if (renderEmptyIfNeeded && this.#model.points.length === 0 && !this.#isLoading &&
          !(this.#emptyListComponent && this.#emptyListComponent.element.textContent.includes('Failed'))) {
        this.#renderEmptyList(this.#filterModel.getFilter());
      }
    }
  }

  // Обработчик сохранения новой точки
  #handleNewPointSave = async (newPointData) => {
    this.#uiBlocker.block(); // Блокируем UI
    if (this.#tripFormCreate) {
      this.#tripFormCreate.setSavingState(true); // Устанавливаем состояние "Saving..." на кнопке формы
    }

    try {
      await this.#model.addPoint(UpdateType.MINOR, newPointData); // Вызываем метод модели для добавления точки
      this.#closeCreateForm(); // Закрываем форму при успехе
    } catch (error) { // Если произошла ошибка при добавлении
      this.#tripFormCreate?.shake(() => { // "Трясем" форму
        this.#tripFormCreate.setSavingState(false); // Сбрасываем состояние кнопки после анимации
      });
    } finally {
      this.#uiBlocker.unblock(); // Разблокируем UI в любом случае
    }
  };

  // Обработчик отмены создания новой точки
  #handleNewPointCancel = () => {
    this.#closeCreateForm(); // Просто закрываем форму
  };
}
