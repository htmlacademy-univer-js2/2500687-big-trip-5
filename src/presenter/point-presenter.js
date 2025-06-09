import TripPointView from '../view/trip-point-view.js';
import TripFormEditView from '../view/trip-form-edit-view.js';
import {render, replace, remove} from '../framework/render.js';
import {UpdateType} from '../utils.js';

export default class PointPresenter {
  #point = null;
  #destinations = [];
  #offersByType = {};
  #tripListComponent = null;
  #pointComponent = null;
  #pointEditComponent = null;
  #onEditStart = null;
  #isEditing = false;

  #tripModel = null;
  #uiBlocker = null;

  constructor({point, destinations, offersByType, tripListComponent, onEditStart, tripModel, uiBlocker}) {
    this.#point = point;
    this.#destinations = destinations;
    this.#offersByType = offersByType;
    this.#tripListComponent = tripListComponent;
    this.#onEditStart = onEditStart;

    this.#tripModel = tripModel;
    this.#uiBlocker = uiBlocker;

    const currentDestination = this.#tripModel.getDestinationById(this.#point.destinationId);
    const currentOffersForPoint = this.#tripModel.getOffersForPointType(this.#point.type)
      .filter((offer) => this.#point.offers.map(String).includes(String(offer.id)));

    this.#pointComponent = new TripPointView(
      this.#point,
      currentDestination,
      currentOffersForPoint,
      this.#editClickHandler,
      this.#favoriteClickHandler
    );
  }

  render() {
    if (this.#pointComponent && this.#tripListComponent.element) {
      render(this.#pointComponent, this.#tripListComponent.element);
    }
  }

  resetView() {
    if (this.#isEditing) {
      if (this.#pointEditComponent && this.#pointEditComponent.element.parentElement) {
        replace(this.#pointComponent, this.#pointEditComponent);
        this.#destroyEditComponent();
      }
      document.removeEventListener('keydown', this.#escKeyDownHandler);
      this.#isEditing = false;
    }
  }

  switchToEditMode() {
    if (this.#isEditing) {
      return;
    }
    this.#pointEditComponent = new TripFormEditView(
      this.#point,
      this.#destinations,
      this.#offersByType,
      this.#formSubmitHandler,
      this.#rollupClickHandler,
      this.#deleteClickHandler
    );
    replace(this.#pointEditComponent, this.#pointComponent);
    document.addEventListener('keydown', this.#escKeyDownHandler);
    this.#onEditStart(this.#point.id);
    this.#isEditing = true;
  }

  updatePoint(updatedPoint) {
    const prevPointComponent = this.#pointComponent;
    this.#point = updatedPoint;
    const currentDestination = this.#tripModel.getDestinationById(this.#point.destinationId);
    const currentOffersForPoint = this.#tripModel.getOffersForPointType(this.#point.type)
      .filter((offer) => this.#point.offers.map(String).includes(String(offer.id)));

    this.#pointComponent = new TripPointView(
      this.#point,
      currentDestination,
      currentOffersForPoint,
      this.#editClickHandler,
      this.#favoriteClickHandler
    );

    if (prevPointComponent.element?.parentElement) {
      replace(this.#pointComponent, prevPointComponent);
      remove(prevPointComponent);
    } else {
      render(this.#pointComponent, this.#tripListComponent.element);
    }
  }

  #destroyEditComponent() {
    if (this.#pointEditComponent) {
      remove(this.#pointEditComponent);
      this.#pointEditComponent = null;
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    remove(this.#pointComponent);
    this.#destroyEditComponent();
    this.#pointComponent = null;
  }

  #editClickHandler = () => {
    this.switchToEditMode();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.#pointEditComponent.resetToInitialState();
      this.resetView();
    }
  };

  #formSubmitHandler = async (updatedPoint) => {
    const isDataChanged = JSON.stringify(this.#point) !== JSON.stringify(updatedPoint);
    if (!isDataChanged && !this.#pointEditComponent._state.isSaving) {
      this.resetView();
      return;
    }

    this.#uiBlocker.block();
    this.#pointEditComponent.setSavingState(true);
    try {
      await this.#tripModel.updatePoint(UpdateType.MINOR, updatedPoint);
      this.resetView();
    } catch (error) {
      this.#pointEditComponent.shake(() => {
        this.#pointEditComponent.setSavingState(false);
      });
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #rollupClickHandler = () => {
    this.#pointEditComponent.resetToInitialState();
    this.resetView();
  };

  #deleteClickHandler = async () => {
    this.#uiBlocker.block();
    this.#pointEditComponent.setDeletingState(true);
    try {
      await this.#tripModel.deletePoint(UpdateType.MINOR, this.#point.id);
    } catch (error) {
      this.#pointEditComponent.shake(() => {
        this.#pointEditComponent.setDeletingState(false);
      });
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #favoriteClickHandler = async () => {
    const updatedPoint = {
      id: this.#point.id,
      type: this.#point.type,
      destinationId: this.#point.destinationId,
      dateFrom: this.#point.dateFrom,
      dateTo: this.#point.dateTo,
      basePrice: this.#point.basePrice,
      offers: this.#point.offers,
      isFavorite: !this.#point.isFavorite,
    };
    try {
      await this.#tripModel.updatePoint(UpdateType.PATCH, updatedPoint);
    } catch (error) {
      this.#pointComponent.shake();
    }
  };
}
