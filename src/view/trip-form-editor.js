import flatpickr from 'flatpickr';
import '../../node_modules/flatpickr/dist/flatpickr.min.css';
import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import dayjs from 'dayjs';

export default class TripFormEdit extends AbstractStatefulView {
  #destinations = [];
  #offersByType = {};
  #handleFormSubmit = null;
  #handleRollupClick = null;
  #handleDeleteClick = null;
  #flatpickrStart = null; // Экземпляр для даты начала
  #flatpickrEnd = null; // Экземпляр для даты окончания
  #initialState = null;
  #previousDestinationName = '';

  constructor(point, destinations, offersByType, onFormSubmit, onRollupClick, onDeleteClick) {
    super();
    this.#destinations = destinations;
    this.#offersByType = offersByType;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleRollupClick = onRollupClick;
    this.#handleDeleteClick = onDeleteClick;

    // Инициализируем состояние
    this.#initialState = structuredClone({
      point: { ...point, offers: point.offers || [] },
      isSaving: false,
      isDeleting: false,
    });
    this._state = structuredClone(this.#initialState);

    // Навешиваем обработчики
    this._restoreHandlers();
  }

  // Метод для отката к исходному состоянию
  resetToInitialState() {
    this.updateElement(this.#initialState);
  }

  updateElement(update) {
    if (!this.element || !this.element.parentElement) {
      return;
    }
    super.updateElement(update);
  }

  get template() {
    const { type, destinationId, dateFrom, dateTo, basePrice, offers } = this._state.point;
    const destination = this.#destinations.find((dest) => String(dest.id) === String(destinationId)) || { name: '', description: '', pictures: [] };
    const availableOffers = this.#offersByType[type] || [];

    const formattedDateFrom = dateFrom ? dayjs(dateFrom).format('DD/MM/YY HH:mm') : '';
    const formattedDateTo = dateTo ? dayjs(dateTo).format('DD/MM/YY HH:mm') : '';

    const saveButtonText = this._state.isSaving ? 'Saving...' : 'Save';
    const deleteButtonText = this._state.isDeleting ? 'Deleting...' : 'Delete';
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
                  ${['Taxi', 'Bus', 'Train', 'Ship', 'Drive', 'Flight', 'Check-in', 'Sightseeing', 'Restaurant'].map((eventType) => `
                    <div class="event__type-item">
                      <input id="event-type-${eventType.toLowerCase()}-1" class="event__type-input visually-hidden" type="radio" name="event-type" value="${eventType.toLowerCase()}" ${type.toLowerCase() === eventType.toLowerCase() ? 'checked' : ''}>
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
              <input class="event__input event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destination.name || ''}" list="destination-list-1">
              <datalist id="destination-list-1">
                ${this.#destinations.map((dest) => `<option value="${dest.name}"></option>`).join('')}
              </datalist>
            </div>
            <div class="event__field-group event__field-group--time">
              <label class="visually-hidden" for="event-start-time-1">From</label>
              <input class="event__input event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${formattedDateFrom}">
              —
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input class="event__input event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${formattedDateTo}">
            </div>
            <div class="event__field-group event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                €
              </label>
              <input class="event__input event__input--price" id="event-price-1" type="number" min="0" step="1" name="event-price" value="${basePrice}" required>
            </div>
            <button class="event__save-btn btn btn--blue" type="submit">${saveButtonText}</button>
            <button class="event__reset-btn" type="reset">${deleteButtonText}</button>
            ${this._state.point.id ? `
              <button class="event__rollup-btn" type="button">
                <span class="visually-hidden">Close event</span>
              </button>
            ` : ''}
          </header>
          <section class="event__details">
            ${availableOffers.length > 0 ? `
              <section class="event__section event__section--offers">
                <h3 class="event__section-title event__section-title--offers">Offers</h3>
                <div class="event__available-offers">
                  ${availableOffers.map((offer) => `
                    <div class="event__offer-selector">
                      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-1" type="checkbox" name="event-offer-${offer.id}" ${offers.includes(offer.id) ? 'checked' : ''} data-offer-id="${offer.id}">
                      <label class="event__offer-label" for="event-offer-${offer.id}-1">
                        <span class="event__offer-title">${offer.title}</span>
                        +€ <span class="event__offer-price">${offer.price}</span>
                      </label>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}
            ${destination.description || destination.pictures.length > 0 ? `
              <section class="event__section event__section--destination">
                <h3 class="event__section-title event__section-title--destination">Destination</h3>
                <p class="event__destination-description">${destination.description}</p>
                ${destination.pictures.length > 0 ? `
                  <div class="event__photos-container">
                    <div class="event__photos-tape">
                      ${destination.pictures.map((pic) => `
                        <img class="event__photo" src="${pic.src}" alt="${pic.description}">
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

  #initFlatpickr() {
    const startDateInput = this.element.querySelector('#event-start-time-1');
    const endDateInput = this.element.querySelector('#event-end-time-1');

    const commonOptions = {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      'time_24hr': true,
      locale: { firstDayOfWeek: 1 },
    };

    if (this.#flatpickrStart) {
      this.#flatpickrStart.destroy();
    }
    if (this.#flatpickrEnd) {
      this.#flatpickrEnd.destroy();
    }

    // Дата начала (From)
    this.#flatpickrStart = flatpickr(startDateInput, {
      ...commonOptions,
      defaultDate: this._state.point.dateFrom,
      onChange: ([userDate]) => {
        const newDateFrom = userDate ? userDate.toISOString() : null;
        this._setState({ point: { ...this._state.point, dateFrom: newDateFrom } });

        if (this.#flatpickrEnd) {
          this.#flatpickrEnd.set('minDate', newDateFrom ? dayjs(newDateFrom).add(1, 'minute').toISOString() : null);
          const currentEndDate = this._state.point.dateTo ? dayjs(this._state.point.dateTo) : null;
          if (newDateFrom && currentEndDate && currentEndDate.isBefore(dayjs(newDateFrom).add(1,'minute'))) {
            const newEndDate = dayjs(newDateFrom).add(1, 'hour').toISOString();
            this._setState({ point: { ...this._state.point, dateTo: newEndDate } });
            this.#flatpickrEnd.setDate(newEndDate, true);
          }
        }
      },
    });

    // Дата окончания (To)
    this.#flatpickrEnd = flatpickr(endDateInput, {
      ...commonOptions,
      defaultDate: this._state.point.dateTo,
      minDate: this._state.point.dateFrom ? dayjs(this._state.point.dateFrom).add(1, 'minute').toISOString() : null,
      onChange: ([userDate]) => {
        const newDateTo = userDate ? userDate.toISOString() : null;
        this._setState({ point: { ...this._state.point, dateTo: newDateTo } });
      },
    });
  }

  _restoreHandlers() {
    // Обработчик отправки формы
    this.element.querySelector('form.event--edit').addEventListener('submit', this.#formSubmitHandler);

    // Обработчик кнопки "Стрелка вверх"
    const rollupBtn = this.element.querySelector('.event__rollup-btn');
    if (rollupBtn) {
      rollupBtn.addEventListener('click', this.#rollupClickHandler);
    }

    // Обработчик смены типа точки
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);

    // Обработчик смены пункта назначения
    const destinationInput = this.element.querySelector('.event__input--destination');
    destinationInput.addEventListener('input', this.#destinationInputHandler);
    destinationInput.addEventListener('change', this.#destinationChangeHandler);
    destinationInput.addEventListener('focus', this.#destinationFocusHandler);
    destinationInput.addEventListener('blur', this.#destinationBlurHandler);

    //Обработчик кнопки Delete
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#deleteOrCancelHandler);

    this.element.querySelector('#event-price-1').addEventListener('input', this.#priceInputHandler);

    const offersContainer = this.element.querySelector('.event__available-offers');
    if (offersContainer) {
      offersContainer.addEventListener('change', this.#offerChangeHandler);
    }

    this.#initFlatpickr(); // Инициализация flatpickr
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    const { type, destinationId, basePrice, dateFrom, dateTo } = this._state.point;
    if (!type || !destinationId || basePrice === '' || !dateFrom || !dateTo) {
      this.shake(); return;
    }
    if (dayjs(dateTo).isBefore(dayjs(dateFrom))) {
      this.shake(); return;
    }
    this.#handleFormSubmit(this.#getUpdatedPoint());
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.resetToInitialState(); // Откат к исходному состоянию
    this.#handleRollupClick();
    this.#resetFlatpickr();
  };

  #deleteOrCancelHandler = (evt) => { // Для формы редактирования это всегда Delete
    evt.preventDefault();
    this.#handleDeleteClick();
  };

  #typeChangeHandler = (evt) => {
    const newType = evt.target.value;
    this.updateElement({
      point: {
        ...this._state.point,
        type: newType,
        offers: [], // Сбрасываем офферы при смене типа
      },
    });
  };

  #destinationInputHandler = (evt) => {
    const inputValue = evt.target.value;
    const validDestination = this.#destinations.find((dest) => dest.name === inputValue);
    if (!validDestination && inputValue !== '') {
      evt.target.value = this._state.point.destinationId
        ? this.#destinations.find((dest) => String(dest.id) === String(this._state.point.destinationId))?.name || ''
        : '';
    }
  };

  #destinationChangeHandler = (evt) => {
    const newDestinationName = evt.target.value;
    const newDestination = this.#destinations.find((dest) => dest.name === newDestinationName);
    if (newDestination) {
      this.updateElement({
        point: {
          ...this._state.point,
          destinationId: newDestination.id,
        },
      });
    } else {
      evt.target.value = this._state.point.destinationId
        ? this.#destinations.find((dest) => String(dest.id) === String(this._state.point.destinationId))?.name || ''
        : '';
    }
    this.#resetFlatpickr();
    this.#initFlatpickr();
  };

  #destinationFocusHandler = (evt) => {
    this.#previousDestinationName = evt.target.value;
    evt.target.value = ''; // Очищаем поле, чтобы показать полный список
  };

  #destinationBlurHandler = (evt) => {
    const inputValue = evt.target.value;
    const validDestination = this.#destinations.find((dest) => dest.name === inputValue);
    if (!validDestination) {
      evt.target.value = this.#previousDestinationName; // Восстанавливаем предыдущее значение
    }
  };

  #priceInputHandler = (evt) => {
    const newPrice = evt.target.value.replace(/[^0-9]/g, '');
    evt.target.value = newPrice;
    this._setState({
      point: { ...this._state.point, basePrice: newPrice }
    });
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
      this._setState({ // Используем _setState, чтобы не вызвать полную перерисовку сразу
        point: { ...this._state.point, offers: Array.from(currentOffers) }
      });
    }
  };

  #getUpdatedPoint() {
    // Собираем данные из _state
    const pointData = this._state.point;
    return {
      ...pointData,
      basePrice: Number(pointData.basePrice) || 0,
      offers: pointData.offers || [],
    };
  }

  setSavingState(isSaving) {
    this.updateElement({ isSaving, isDeleting: false });
  }

  setDeletingState(isDeleting) {
    this.updateElement({ isDeleting, isSaving: false });
  }

  #resetFlatpickr() {
    if (this.#flatpickrStart) {
      this.#flatpickrStart.destroy();
    }
    if (this.#flatpickrEnd) {
      this.#flatpickrEnd.destroy();
    }
    this.#flatpickrStart = null;
    this.#flatpickrEnd = null;
  }
}
