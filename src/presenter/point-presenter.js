import TripPoint from '../view/trip-point.js';
import TripFormEdit from '../view/trip-form-editor.js';
import { render, replace } from '../framework/render.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';

const ActionType = {
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ADD: 'ADD',
};

export default class PointPresenter {
  #point = null;
  #destinations = [];
  #offersByType = {};
  #tripListComponent = null;
  #pointComponent = null;
  #pointEditComponent = null;
  #onDataChange = null;
  #onEditStart = null; // Колбэк для уведомления TripPresenter
  #isEditing = false; // Флаг для отслеживания режима
  #uiBlocker = null;

  constructor({point, destination, offers, destinations, offersByType, tripListComponent, onDataChange, onEditStart}) {
    this.#point = point;
    this.#destinations = destinations;
    this.#offersByType = offersByType;
    this.#tripListComponent = tripListComponent;
    this.#onDataChange = onDataChange;
    this.#onEditStart = onEditStart;

    this.#pointComponent = new TripPoint(
      point,
      destination,
      offers,
      this.#handleEditClick
    );
    this.#pointEditComponent = new TripFormEdit(
      point,
      this.#destinations, // Передаём весь массив destinations
      this.#offersByType, // Передаём весь объект offersByType
      this.#handleFormSubmit,
      this.#handleRollupClick,
      this.#handleDeleteClick
    );
    this.#uiBlocker = new UiBlocker({
      lowerLimit: 300,
      upperLimit: 1000,
    });

    this.#renderPoint();
  }

  #renderPoint() {
    render(this.#pointComponent, this.#tripListComponent.element);

    this.#pointComponent.element
      .querySelector('.event__favorite-btn')
      .addEventListener('click', this.#handleFavoriteClick);
  }

  resetView() {
    if (this.#isEditing) {
      this.#pointEditComponent.resetToInitialState();
      if (this.#pointEditComponent.element && this.#pointEditComponent.element.parentElement) {
        replace(this.#pointComponent, this.#pointEditComponent);
      }
      this.#isEditing = false;
    }
  }

  resetFormToInitialState() {
    if (this.#pointEditComponent) {
      this.#pointEditComponent.resetToInitialState();
    }
  }

  switchToEditMode() {
    if (!this.#isEditing) {
      replace(this.#pointEditComponent, this.#pointComponent);
      this.#isEditing = true;
    }
  }

  #handleEditClick = () => {
    this.#onEditStart(this.#point.id); // Уведомляем TripPresenter
  };

  #handleFormSubmit = async (updatedPoint) => {
    this.#uiBlocker.block();
    this.#pointEditComponent.startLoading({ isSaving: true });
    try {
      await this.#onDataChange(ActionType.UPDATE, updatedPoint);
      this.#pointEditComponent.stopLoading();
      this.#uiBlocker.unblock();
      this.resetView();
    } catch (error) {
      this.#pointEditComponent.stopLoading();
      this.#uiBlocker.unblock();
      this.#pointEditComponent.shake();
    }
  };

  #handleRollupClick = () => {
    replace(this.#pointComponent, this.#pointEditComponent);
    this.#isEditing = false;
  };

  #handleDeleteClick = async () => {
    this.#uiBlocker.block();
    if (!this.#pointEditComponent) {
      this.#uiBlocker.unblock();
      return;
    }
    this.#pointEditComponent.startLoading({ isDeleting: true });
    try {
      await this.#onDataChange(ActionType.DELETE, this.#point);
      this.#uiBlocker.unblock();
      this.#onEditStart(null);
      this.destroy();
    } catch (error) {
      if (this.#pointEditComponent) {
        this.#pointEditComponent.stopLoading();
        this.#pointEditComponent.shake();
      }
      this.#uiBlocker.unblock();
    }
  };

  #handleFavoriteClick = (evt) => {
    evt.preventDefault();
    const updatedPoint = { ...this.#point, isFavorite: !this.#point.isFavorite };
    this.#onDataChange(ActionType.UPDATE, updatedPoint);
  };

  destroy() {
    if (this.#pointComponent) {
      const favoriteBtn = this.#pointComponent.element.querySelector('.event__favorite-btn');
      if (favoriteBtn) {
        favoriteBtn.removeEventListener('click', this.#handleFavoriteClick);
      }
      if (this.#pointComponent.element.parentElement) {
        this.#pointComponent.element.remove();
      }
      this.#pointComponent = null;
    }
    if (this.#pointEditComponent) {
      if (this.#pointEditComponent.element.parentElement) {
        this.#pointEditComponent.element.remove();
      }
      this.#pointEditComponent = null;
    }
    this.#isEditing = false;
  }

  get element() {
    return this.#pointComponent.element || this.#pointEditComponent.element;
  }
}
