import SortView from '../view/sort-view.js';
import TripFormCreateView from '../view/trip-form-create-view.js';
import TripListView from '../view/trip-list-view.js';
import EmptyListView from '../view/empty-list-view.js';
import ErrorMessageView from '../view/error-message-view.js';
import PointPresenter from './point-presenter.js';
import LoadingView from '../view/loading-view.js';
import {render, replace, remove} from '../framework/render.js';
import {UpdateType, SortType, FilterType} from '../utils.js';
import dayjs from 'dayjs';

const NEW_POINT_FORM_ID = 'new-point-form';

export default class TripPresenter {
  #model = null;
  #filterModel = null;

  #tripListComponent = new TripListView();
  #sortComponent = null;
  #emptyListComponent = null;
  #loadingComponent = null;

  #pointPresenters = new Map();
  #tripFormCreate = null;
  #currentEditingPointId = null;

  #newEventButton = null;
  #tripEventsContainer = null;
  #uiBlocker = null;
  #isLoading = true;
  #currentSortType = SortType.DAY;

  constructor({model, filterModel, uiBlocker}) {
    this.#model = model;
    this.#filterModel = filterModel;
    this.#uiBlocker = uiBlocker;

    this.#newEventButton = document.querySelector('.trip-main__event-add-btn');
    this.#tripEventsContainer = document.querySelector('.trip-events');

    this.#model.addObserver(this.#modelEventHandler);
    this.#filterModel.addObserver(this.#filterChangeHandler);
  }

  init() {
    this.#newEventButton.addEventListener('click', this.#newEventClickHandler);
    this.#renderBoard();
  }

  #renderBoard() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const points = this.#getSortedPoints();
    const currentFilterType = this.#filterModel.getFilter();

    const prevSortComponent = this.#sortComponent;
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: [SortType.EVENT, SortType.OFFER],
      onSortTypeChange: this.#sortTypeChangeHandler,
    });

    if (prevSortComponent) {
      replace(this.#sortComponent, prevSortComponent);
    } else {
      render(this.#sortComponent, this.#tripEventsContainer, 'afterbegin');
    }

    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }

    if (points.length === 0 && !this.#tripFormCreate) {
      this.#renderEmptyList(currentFilterType);
      if (this.#tripListComponent.element.parentElement) {
        remove(this.#tripListComponent);
      }
      return;
    }

    render(this.#tripListComponent, this.#tripEventsContainer);
    this.#renderPoints(points);
  }

  #renderLoading() {
    this.#removeNonBoardStaticMessages();
    this.#loadingComponent = new LoadingView();
    render(this.#loadingComponent, this.#tripEventsContainer);
    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }
    if (this.#tripListComponent.element.parentElement) {
      remove(this.#tripListComponent);
    }
  }

  #renderErrorMessage() {
    this.#removeNonBoardStaticMessages();
    this.#emptyListComponent = new ErrorMessageView();
    render(this.#emptyListComponent, this.#tripEventsContainer);
  }

  #renderEmptyList (filterType) {
    this.#removeNonBoardStaticMessages();
    this.#emptyListComponent = new EmptyListView(filterType);
    render(this.#emptyListComponent, this.#tripEventsContainer);
    if (this.#tripListComponent.element.parentElement) {
      remove(this.#tripListComponent);
    }
  }

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

  #getSortedPoints() {
    let points = [...this.#model.points];
    const currentFilterType = this.#filterModel.getFilter();
    const now = dayjs();

    switch (currentFilterType) {
      case FilterType.EVERYTHING:
        break;
      case FilterType.PAST:
        points = points.filter((point) => dayjs(point.dateTo).isBefore(now));
        break;
      case FilterType.PRESENT:
        points = points.filter((point) => dayjs(point.dateFrom) <= now && now <= dayjs(point.dateTo));
        break;
      case FilterType.FUTURE:
        points = points.filter((point) => dayjs(point.dateFrom).isAfter(now));
        break;
    }

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

  #clearPointList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #renderPoints(points) {
    points.forEach((point) => this.#createPointPresenter(point));
  }

  #createPointPresenter(point) {
    if (this.#pointPresenters.has(point.id)) {
      this.#pointPresenters.get(point.id).destroy();
    }

    const pointPresenter = new PointPresenter({
      point,
      destinations: this.#model.destinations,
      offersByType: this.#model.offersByType,
      tripListComponent: this.#tripListComponent,
      onEditStart: this.#editStartHandler,
      tripModel: this.#model,
      uiBlocker: this.#uiBlocker
    });
    pointPresenter.render();
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #sortTypeChangeHandler = (newSortType) => {
    if (this.#currentSortType === newSortType) {
      return;
    }
    this.#currentSortType = newSortType;
    const newSortComponent = new SortView({
      currentSortType: this.#currentSortType,
      disabledSortTypes: ['event', 'offer'],
      onSortTypeChange: this.#sortTypeChangeHandler,
    });
    replace(newSortComponent, this.#sortComponent);
    this.#sortComponent = newSortComponent;

    this.#renderBoard();
  };

  #editStartHandler = (pointIdBeingEdited) => {
    if (this.#currentEditingPointId && this.#currentEditingPointId !== pointIdBeingEdited && this.#currentEditingPointId !== NEW_POINT_FORM_ID) {
      this.#pointPresenters.get(this.#currentEditingPointId)?.resetView();
    }
    if (pointIdBeingEdited !== NEW_POINT_FORM_ID && this.#tripFormCreate) {
      this.#closeCreateForm(false);
    }
    this.#currentEditingPointId = pointIdBeingEdited;
  };

  #documentEscKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      if (this.#currentEditingPointId === NEW_POINT_FORM_ID && this.#tripFormCreate) {
        this.#newPointCancelHandler();
      } else if (this.#currentEditingPointId) {
        const presenter = this.#pointPresenters.get(this.#currentEditingPointId);
        presenter?.resetView();
        this.#currentEditingPointId = null;
        this.#newEventButton.disabled = false;
      }
    }
  };

  #filterChangeHandler = () => {
    this.#currentSortType = SortType.DAY;
    this.#clearPointList();
    this.#renderBoard();
  };

  #modelEventHandler = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        if (this.#pointPresenters.has(data.id)) {
          this.#pointPresenters.get(data.id).updatePoint(data);
        }
        break;
      case UpdateType.MINOR:
        this.#clearPointList();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#currentSortType = SortType.DAY;
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
          document.addEventListener('keydown', this.#documentEscKeyDownHandler);
        }
        break;
    }
  };

  #newEventClickHandler = () => {
    let needsFullReRender = false;
    if (this.#filterModel.getFilter() !== FilterType.EVERYTHING) {
      this.#filterModel.setFilter(FilterType.EVERYTHING);
      needsFullReRender = true;
    }

    if (this.#currentSortType !== SortType.DAY) {
      this.#currentSortType = SortType.DAY;
      if (!needsFullReRender) {
        this.#clearPointList();
        this.#renderBoard();
      }
    }

    if (this.#currentEditingPointId && this.#currentEditingPointId !== NEW_POINT_FORM_ID) {
      this.#pointPresenters.get(this.#currentEditingPointId)?.resetView();
      this.#currentEditingPointId = null;
    }

    if (this.#tripFormCreate) {
      this.#closeCreateForm(false);
    }

    this.#removeNonBoardStaticMessages();

    if (!this.#tripEventsContainer.contains(this.#sortComponent?.element)) {
      const prevSortComponent = this.#sortComponent;
      this.#sortComponent = new SortView({
        currentSortType: this.#currentSortType,
        disabledSortTypes: [SortType.EVENT, SortType.OFFER],
        onSortTypeChange: this.#sortTypeChangeHandler,
      });
      if (prevSortComponent) {
        replace(this.#sortComponent, prevSortComponent);
        remove(prevSortComponent);
      } else {
        render(this.#sortComponent, this.#tripEventsContainer, 'afterbegin');
      }
    }

    if (!this.#tripEventsContainer.contains(this.#tripListComponent.element)) {
      render(this.#tripListComponent, this.#tripEventsContainer);
    }

    this.#tripFormCreate = new TripFormCreateView(
      this.#model.destinations,
      this.#model.offersByType,
      this.#newPointSaveHandler,
      this.#newPointCancelHandler
    );

    render(this.#tripFormCreate, this.#tripListComponent.element, 'afterbegin');
    this.#currentEditingPointId = NEW_POINT_FORM_ID;
    this.#newEventButton.disabled = true;
    document.addEventListener('keydown', this.#documentEscKeyDownHandler);
  };

  #closeCreateForm(renderEmptyIfNeeded = true) {
    if (this.#tripFormCreate) {
      remove(this.#tripFormCreate);
      this.#tripFormCreate = null;
      this.#currentEditingPointId = null;
      this.#newEventButton.disabled = false;

      if (renderEmptyIfNeeded && this.#model.points.length === 0 && !this.#isLoading &&
          !(this.#emptyListComponent && this.#emptyListComponent.element.textContent.includes('Failed'))) {
        this.#renderEmptyList(this.#filterModel.getFilter());
      }
    }
  }

  #newPointSaveHandler = async (newPointData) => {
    this.#uiBlocker.block();
    if (this.#tripFormCreate) {
      this.#tripFormCreate.setSavingState(true);
    }

    try {
      await this.#model.addPoint(UpdateType.MINOR, newPointData);
      this.#closeCreateForm();
    } catch (error) {
      this.#tripFormCreate?.shake(() => {
        this.#tripFormCreate.setSavingState(false);
      });
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #newPointCancelHandler = () => {
    this.#closeCreateForm();
  };
}
