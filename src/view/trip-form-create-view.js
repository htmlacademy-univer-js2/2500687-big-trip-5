import TripFormBaseView from './trip-form-base-view.js';
import {DEFAULT_EVENT_TYPE} from '../utils.js';

export default class TripFormCreateView extends TripFormBaseView {
  #cancelClickHandler = null;

  constructor(destinations, offersByType, onFormSubmit, onCancelClick) {
    super(null, destinations, offersByType);

    this._outerFormSubmitHandler = onFormSubmit;
    this.#cancelClickHandler = onCancelClick;

    this._state = {
      point: {
        type: DEFAULT_EVENT_TYPE,
        destinationId: null,
        dateFrom: null,
        dateTo: null,
        basePrice: 0,
        offers: [],
      },
      isSaving: false,
    };

    this._restoreHandlers();
  }

  _getControlButtonsTemplate() {
    const saveButtonText = this._state.isSaving ? 'Saving...' : 'Save';
    return `
      <button class="event__save-btn btn btn--blue" type="submit" ${this._state.isSaving ? 'disabled' : ''}>${saveButtonText}</button>
      <button class="event__reset-btn" type="reset" ${this._state.isSaving ? 'disabled' : ''}>Cancel</button>
    `;
  }

  _restoreHandlers() {
    super._restoreHandlers();
    this.element.querySelector('form.event--edit').addEventListener('submit', this._formSubmitHandler);
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#cancelButtonClickHandler);
  }

  _getPointDataForSubmit() {
    const pointData = this._state.point;
    return {
      type: pointData.type,
      destinationId: pointData.destinationId,
      dateFrom: pointData.dateFrom,
      dateTo: pointData.dateTo,
      basePrice: Number(pointData.basePrice) || 0,
      offers: pointData.offers || [],
      isFavorite: false,
    };
  }

  #cancelButtonClickHandler = (evt) => {
    evt.preventDefault();
    this.#cancelClickHandler();
  };
}
