import TripFormBaseView from './trip-form-base-view.js';

export default class TripFormEdit extends TripFormBaseView {
  #rollupClickHandler = null;
  #deleteClickHandler = null;
  #initialState = null;

  constructor(point, destinations, offersByType, onFormSubmit, onRollupClick, onDeleteClick) {
    super(null, destinations, offersByType);

    this._outerFormSubmitHandler = onFormSubmit;
    this.#rollupClickHandler = onRollupClick;
    this.#deleteClickHandler = onDeleteClick;

    this.#initialState = {
      point: {...point, offers: point.offers ? [...point.offers.map(String)] : []},
      isSaving: false,
      isDeleting: false,
    };
    this._state = structuredClone(this.#initialState);

    this._restoreHandlers();
  }

  _getControlButtonsTemplate() {
    const saveButtonText = this._state.isSaving ? 'Saving...' : 'Save';
    const deleteButtonText = this._state.isDeleting ? 'Deleting...' : 'Delete';
    return `
      <button class="event__save-btn btn btn--blue" type="submit" ${this._state.isSaving || this._state.isDeleting ? 'disabled' : ''}>${saveButtonText}</button>
      <button class="event__reset-btn" type="reset" ${this._state.isSaving || this._state.isDeleting ? 'disabled' : ''}>${deleteButtonText}</button>
      <button class="event__rollup-btn" type="button" ${this._state.isSaving || this._state.isDeleting ? 'disabled' : ''}>
        <span class="visually-hidden">Close event</span>
      </button>
    `;
  }

  _restoreHandlers() {
    super._restoreHandlers();
    this.element.querySelector('form.event--edit').addEventListener('submit', this._formSubmitHandler);
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#rollupButtonClickHandler);
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#deleteButtonClickHandler);
  }

  resetToInitialState() {
    if (this.element && this.element.parentElement) {
      this.updateElement(this.#initialState);
    }
  }

  _getPointDataForSubmit() {
    const pointData = this._state.point;
    return {
      ...pointData,
      basePrice: Number(pointData.basePrice) || 0,
      offers: pointData.offers || [],
    };
  }

  #rollupButtonClickHandler = (evt) => {
    evt.preventDefault();
    this.resetToInitialState();
    this.#rollupClickHandler();
  };

  #deleteButtonClickHandler = (evt) => {
    evt.preventDefault();
    this.#deleteClickHandler();
  };
}
