import TripPoint from '../view/trip-point.js';
import TripFormEdit from '../view/trip-form-editor.js';
import { render, replace } from '../framework/render.js';

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
      this.#handleRollupClick
    );

    this.#renderPoint();
  }

  #renderPoint() {
    render(this.#pointComponent, this.#tripListComponent.element);

    this.#pointComponent.element
      .querySelector('.event__favorite-btn')
      .addEventListener('click', this.#handleFavoriteClick);
  }

  resetView() {
    if (this.#isEditing && this.#pointEditComponent.element.parentElement) {
      replace(this.#pointComponent, this.#pointEditComponent);
      this.#isEditing = false;
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

  #handleFormSubmit = () => {
    replace(this.#pointComponent, this.#pointEditComponent);
    this.#isEditing = false;
  };

  #handleRollupClick = () => {
    replace(this.#pointComponent, this.#pointEditComponent);
    this.#isEditing = false;
  };

  #handleFavoriteClick = (evt) => {
    evt.preventDefault();
    const updatedPoint = { ...this.#point, isFavorite: !this.#point.isFavorite };
    this.#onDataChange(updatedPoint);
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
