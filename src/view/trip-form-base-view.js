import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import flatpickr from 'flatpickr';
import '../../node_modules/flatpickr/dist/flatpickr.min.css';
import dayjs from 'dayjs';
import he from 'he';
import {DEFAULT_DURATION, EVENT_TYPES} from '../utils.js';

export default class TripFormBaseView extends AbstractStatefulView {
  _destinations = [];
  _offersByType = {};
  _flatpickrStart = null;
  _flatpickrEnd = null;
  _previousDestinationName = '';

  constructor(initialPointState, destinations, offersByType) {
    super();
    this._destinations = destinations || [];
    this._offersByType = offersByType || {};
  }

  get template() {
    const {type, destinationId, dateFrom, dateTo, basePrice, offers} = this._state.point;
    const currentDestination = this._destinations.find((dest) => String(dest.id) === String(destinationId)) || {name: '', description: '', pictures: []};
    const availableOffers = this._offersByType[type.toLowerCase()] || [];

    const formattedDateFrom = dateFrom ? dayjs(dateFrom).format('DD/MM/YY HH:mm') : '';
    const formattedDateTo = dateTo ? dayjs(dateTo).format('DD/MM/YY HH:mm') : '';

    const hasDestinationInfo = currentDestination && (currentDestination.description || (currentDestination.pictures && currentDestination.pictures.length > 0));
    return `
      <li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="17" height="17" src="img/icons/${type.toLowerCase()}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle visually-hidden" id="event-type-toggle-1" type="checkbox">
              <div class="event__type-list">
                <fieldset class="event__type-group">
                  <legend class="visually-hidden">Event type</legend>
                  ${EVENT_TYPES.map((eventType) => `
                    <div class="event__type-item">
                      <input id="event-type-${eventType.toLowerCase()}-1" class="event__type-input visually-hidden" type="radio" name="event-type" value="${eventType}" ${type === eventType ? 'checked' : ''}>
                      <label class="event__type-label event__type-label--${eventType.toLowerCase()}" for="event-type-${eventType.toLowerCase()}-1">${eventType}</label>
                    </div>
                  `).join('')}
                </fieldset>
              </div>
            </div>
            <div class="event__field-group event__field-group--destination">
              <label class="event__label event__type-output" for="event-destination-1">
                ${type}
              </label>
              <input class="event__input event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${he.encode(currentDestination.name || '')}" list="destination-list-1" required>
              <datalist id="destination-list-1">
                ${this._destinations.map((dest) => `<option value="${he.encode(dest.name)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="event__field-group event__field-group--time">
              <label class="visually-hidden" for="event-start-time-1">From</label>
              <input class="event__input event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${formattedDateFrom}" required>
              —
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input class="event__input event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${formattedDateTo}" required>
            </div>
            <div class="event__field-group event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                €
              </label>
              <input class="event__input event__input--price" id="event-price-1" type="number" min="0" step="1" name="event-price" value="${basePrice}" required>
            </div>
            ${this._getControlButtonsTemplate()}
          </header>
          <section class="event__details">
            ${availableOffers.length > 0 ? `
              <section class="event__section event__section--offers">
                <h3 class="event__section-title event__section-title--offers">Offers</h3>
                <div class="event__available-offers">
                  ${availableOffers.map((offer) => `
                    <div class="event__offer-selector">
                      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-1" type="checkbox" name="event-offer-${offer.id}" ${offers.map(String).includes(String(offer.id)) ? 'checked' : ''} data-offer-id="${offer.id}">
                      <label class="event__offer-label" for="event-offer-${offer.id}-1">
                        <span class="event__offer-title">${he.encode(offer.title)}</span>
                        +€<span class="event__offer-price">${offer.price}</span>
                      </label>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}
            ${hasDestinationInfo ? `
              <section class="event__section event__section--destination">
                <h3 class="event__section-title event__section-title--destination">Destination</h3>
                <p class="event__destination-description">${he.encode(currentDestination.description || '')}</p>
                ${(currentDestination.pictures && currentDestination.pictures.length > 0) ? `
                  <div class="event__photos-container">
                    <div class="event__photos-tape">
                      ${currentDestination.pictures.map((pic) => `
                        <img class="event__photo" src="${he.encode(pic.src)}" alt="${he.encode(pic.description)}">
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </section>
            ` : ''}
          </section>
        </form>
      </li>
    `;
  }

  _getControlButtonsTemplate() {
    throw new Error('Abstract method _getControlButtonsTemplate() must be implemented.');
  }

  _restoreHandlers() {
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);

    const destinationInput = this.element.querySelector('.event__input--destination');
    destinationInput.addEventListener('change', this.#destinationChangeHandler);
    destinationInput.addEventListener('focus', this.#destinationFocusHandler);
    destinationInput.addEventListener('blur', this.#destinationBlurHandler);

    this.element.querySelector('#event-price-1').addEventListener('input', this.#priceInputHandler);

    const offersContainer = this.element.querySelector('.event__available-offers');
    if (offersContainer) {
      offersContainer.addEventListener('change', this.#offerChangeHandler);
    }

    this.#initFlatpickr();
  }

  #initFlatpickr() {
    const startDateInput = this.element.querySelector('#event-start-time-1');
    const endDateInput = this.element.querySelector('#event-end-time-1');

    const commonOptions = {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      'time_24hr': true,
      locale: {firstDayOfWeek: 1},
    };

    this._destroyFlatpickr();

    this._flatpickrStart = flatpickr(startDateInput, {
      ...commonOptions,
      defaultDate: this._state.point.dateFrom,
      onChange: ([userDate]) => {
        const newDateFrom = userDate ? userDate.toISOString() : null;
        this._setState({point: {...this._state.point, dateFrom: newDateFrom}});
        if (this._flatpickrEnd) {
          this._flatpickrEnd.set('minDate', newDateFrom ? dayjs(newDateFrom).add(DEFAULT_DURATION, 'minute').toISOString() : null);
          const currentEndDate = this._state.point.dateTo ? dayjs(this._state.point.dateTo) : null;
          if (newDateFrom && currentEndDate && currentEndDate.isBefore(dayjs(newDateFrom).add(DEFAULT_DURATION,'minute'))) {
            const newEndDate = dayjs(newDateFrom).add(DEFAULT_DURATION, 'hour').toISOString();
            this._updateStateAnDFlatpickrEnd(newEndDate);
          }
        }
      },
    });

    this._flatpickrEnd = flatpickr(endDateInput, {
      ...commonOptions,
      defaultDate: this._state.point.dateTo,
      minDate: this._state.point.dateFrom ? dayjs(this._state.point.dateFrom).add(1, 'minute').toISOString() : null,
      onChange: ([userDate]) => {
        const newDateTo = userDate ? userDate.toISOString() : null;
        this._setState({point: {...this._state.point, dateTo: newDateTo}});
      },
    });
  }

  _updateStateAnDFlatpickrEnd(newEndDate) {
    this._setState({point: {...this._state.point, dateTo: newEndDate}});
    if (this._flatpickrEnd) {
      this._flatpickrEnd.setDate(newEndDate, true);
    }
  }

  _destroyFlatpickr() {
    if (this._flatpickrStart) {
      this._flatpickrStart.destroy();
      this._flatpickrStart = null;
    }
    if (this._flatpickrEnd) {
      this._flatpickrEnd.destroy();
      this._flatpickrEnd = null;
    }
  }

  removeElement() {
    super.removeElement();
    this._destroyFlatpickr();
  }

  #typeChangeHandler = (evt) => {
    const newType = evt.target.value;
    this.updateElement({
      point: {
        ...this._state.point,
        type: newType,
        offers: [],
      },
    });
  };

  #destinationChangeHandler = (evt) => {
    const newDestinationName = evt.target.value;
    const newDestination = this._destinations.find((dest) => dest.name === newDestinationName);

    if (newDestination) {
      this.updateElement({
        point: {
          ...this._state.point,
          destinationId: newDestination.id,
        },
      });
      this._previousDestinationName = newDestinationName;
    } else {
      this.updateElement({
        point: {
          ...this._state.point,
          destinationId: null,
        },
      });
    }
  };

  #destinationFocusHandler = (evt) => {
    this._previousDestinationName = evt.target.value;
    evt.target.value = '';
  };

  #destinationBlurHandler = (evt) => {
    const currentInputName = evt.target.value;
    const isValidDestination = this._destinations.some((dest) => dest.name === currentInputName);

    if (!isValidDestination) {
      const previousValidDestination = this._destinations.find((dest) => dest.name === this._previousDestinationName);
      if (previousValidDestination) {
        this.updateElement({
          point: {...this._state.point, destinationId: previousValidDestination.id}
        });
      } else {
        this.updateElement({
          point: {...this._state.point, destinationId: null}
        });
      }
    }
  };

  #priceInputHandler = (evt) => {
    const rawValue = evt.target.value;
    let newPrice;
    if (rawValue === '') {
      newPrice = 0;
    } else {
      newPrice = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);
    }

    if (isNaN(newPrice) || newPrice < 0) {
      newPrice = (this._state.point.basePrice !== null && this._state.point.basePrice >= 0) ? this._state.point.basePrice : 0;
    }
    evt.target.value = rawValue === '' ? '' : String(newPrice);
    this._setState({point: {...this._state.point, basePrice: newPrice}});
  };

  #offerChangeHandler = (evt) => {
    if (evt.target.matches('.event__offer-checkbox')) {
      const offerId = evt.target.dataset.offerId;
      const currentOffers = new Set(this._state.point.offers.map(String));

      if (evt.target.checked) {
        currentOffers.add(offerId);
      } else {
        currentOffers.delete(offerId);
      }
      this._setState({
        point: {...this._state.point, offers: Array.from(currentOffers)}
      });
    }
  };

  setSavingState(isSaving) {
    this.updateElement({isSaving, isDeleting: this._state.isDeleting && !isSaving});
  }

  setDeletingState(isDeleting) {
    this.updateElement({isDeleting, isSaving: this._state.isSaving && !isDeleting});
  }

  _formSubmitHandler = (evt) => {
    evt.preventDefault();
    const {type, destinationId, basePrice, dateFrom, dateTo} = this._state.point;

    if (!type || !destinationId || basePrice === '' || Number(basePrice) < 0 || !dateFrom || !dateTo) {
      this.shake();
      return;
    }

    const pointDataForSubmit = this._getPointDataForSubmit();
    this._outerFormSubmitHandler(pointDataForSubmit);
  };

  _getPointDataForSubmit() {
    throw new Error('Abstract method _getPointDataForSubmit() must be implemented.');
  }

  _outerFormSubmitHandler = null;
}
