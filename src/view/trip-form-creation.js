import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import '../../node_modules/flatpickr/dist/flatpickr.min.css';
import flatpickr from 'flatpickr';
import dayjs from 'dayjs';

export default class TripFormCreate extends AbstractStatefulView {
  #destinations = [];
  #offersByType = {};
  #handleFormSubmit = null;
  #handleCancelClick = null;
  #flatpickrStart = null; // Экземпляр для даты начала
  #flatpickrEnd = null; // Экземпляр для даты окончания
  #previousDestinationName = '';

  constructor(destinations, offersByType, onFormSubmit, onCancelClick) {
    super();
    this.#destinations = destinations || [];
    this.#offersByType = offersByType || {};
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCancelClick = onCancelClick;

    // Инициализируем состояние с дефолтными значениями
    const defaultType = 'Flight';
    this._state = {
      point: {
        type: defaultType,
        destinationId: null,
        dateFrom: null, // Устанавливаем текущую дату как начальную
        dateTo: null, // Устанавливаем дату через час как конечную
        basePrice: 0,
        offers: [],
      },
      isSaving: false,
    };

    // Навешиваем обработчики
    this._restoreHandlers();
  }

  get template(){
    const { type, destinationId, dateFrom, dateTo, basePrice, offers } = this._state.point;
    const destination = this.#destinations.find((dest) => dest.id === destinationId) || { name: '', description: '', pictures: [] };
    const availableOffers = this.#offersByType[type.toLowerCase()] || [];

    // Форматируем даты для отображения в flatpickr
    const formattedDateFrom = dateFrom ? dayjs(dateFrom).format('DD/MM/YY HH:mm') : '';
    const formattedDateTo = dateTo ? dayjs(dateTo).format('DD/MM/YY HH:mm') : '';

    const saveButtonText = this._state.isSaving ? 'Saving...' : 'Save';

    // Определяем, есть ли информация о пункте назначения
    // Пункт назначения считается "информативным", если есть описание ИЛИ картинки
    const hasDestinationInfo = destination && (destination.description || (destination.pictures && destination.pictures.length > 0));


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
              <input class="event__input event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destination.name}" list="destination-list-1">
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
            <button class="event__reset-btn" type="reset">Cancel</button>
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
            ${hasDestinationInfo ? `
              <section class="event__section event__section--destination">
                <h3 class="event__section-title event__section-title--destination">Destination</h3>
                <p class="event__destination-description">${destination.description || ''}</p>
                ${(destination.pictures && destination.pictures.length > 0) ? `
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
      locale: { firstDayOfWeek: 1 }, // Понедельник - первый день недели
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
      // НЕТ maxDate для startDateInput - он может быть любым в будущем
      onChange: ([userDate]) => {
        const newDateFrom = userDate ? userDate.toISOString() : null;
        this._setState({ point: { ...this._state.point, dateFrom: newDateFrom } });

        if (this.#flatpickrEnd) {
          // Устанавливаем минимальную дату для dateTo (не раньше, чем dateFrom + 1 минута)
          this.#flatpickrEnd.set('minDate', newDateFrom ? dayjs(newDateFrom).add(1, 'minute').toISOString() : null);

          // Если текущая dateTo стала невалидной (раньше новой dateFrom),
          // сбрасываем dateTo или устанавливаем новое значение по умолчанию (например, dateFrom + 1 час)
          const currentEndDate = this._state.point.dateTo ? dayjs(this._state.point.dateTo) : null;
          if (newDateFrom && currentEndDate && currentEndDate.isBefore(dayjs(newDateFrom).add(1, 'minute'))) {
            const newEndDate = dayjs(newDateFrom).add(1, 'hour').toISOString();
            this._setState({ point: { ...this._state.point, dateTo: newEndDate } });
            this.#flatpickrEnd.setDate(newEndDate, true); // Обновить значение в календаре dateTo
          }
        }
      },
    });

    // Дата окончания (To)
    this.#flatpickrEnd = flatpickr(endDateInput, {
      ...commonOptions,
      defaultDate: this._state.point.dateTo,
      // minDate для dateTo устанавливается на основе текущей dateFrom
      minDate: this._state.point.dateFrom ? dayjs(this._state.point.dateFrom).add(1, 'minute').toISOString() : null,
      // Для dateTo нет явного maxDate, если не требуется ограничивать максимальную длительность поездки
      onChange: ([userDate]) => {
        const newDateTo = userDate ? userDate.toISOString() : null;
        // Дата окончания не может быть раньше даты начала.
        const currentDateFrom = this._state.point.dateFrom ? dayjs(this._state.point.dateFrom) : null;
        if (newDateTo && currentDateFrom && dayjs(newDateTo).isBefore(currentDateFrom.add(1, 'minute'))) {
          return;
        }

        this._setState({ point: { ...this._state.point, dateTo: newDateTo } });
      },
    });
  }

  _restoreHandlers() {
    // Обработчик отправки формы
    this.element.querySelector('form.event--edit').addEventListener('submit', this.#formSubmitHandler);

    // Обработчик кнопки "Cancel"
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#cancelClickHandler);

    // Обработчик смены типа точки
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);

    // Обработчик смены пункта назначения
    const destinationInput = this.element.querySelector('.event__input--destination');
    destinationInput.addEventListener('input', this.#destinationInputHandler);
    destinationInput.addEventListener('change', this.#destinationChangeHandler);
    destinationInput.addEventListener('focus', this.#destinationFocusHandler);
    destinationInput.addEventListener('blur', this.#destinationBlurHandler);

    this.element.querySelector('#event-price-1').addEventListener('input', this.#priceInputHandler);

    const offersContainer = this.element.querySelector('.event__available-offers');
    if (offersContainer) {
      offersContainer.addEventListener('change', this.#offerChangeHandler);
    }

    this.element.addEventListener('keydown', this.#escKeyDownHandler);
    this.#initFlatpickr();
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    const { type, destinationId, basePrice, dateFrom, dateTo } = this._state.point;
    if (!type || !destinationId || basePrice === '' || !dateFrom || !dateTo) {
      this.shake();
      return;
    }
    if (dayjs(dateTo).isBefore(dayjs(dateFrom))) {
      this.shake();
      return;
    }
    this.#handleFormSubmit(this.#getNewPoint());
  };

  #cancelClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleCancelClick();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.#handleCancelClick();
    }
  };

  #getNewPoint() {
    const pointData = this._state.point;
    return {
      type: pointData.type,
      destinationId: pointData.destinationId,
      dateFrom: pointData.dateFrom,
      dateTo: pointData.dateTo,
      basePrice: Number(pointData.basePrice) || 0, // Убедимся, что это число
      offers: pointData.offers || [],
      isFavorite: false, // Новая точка по умолчанию не избранная
    };
  }

  #typeChangeHandler = (evt) => {
    const newType = evt.target.value; // value уже содержит "Flight", "Bus" и т.д.
    this.updateElement({
      point: {
        ...this._state.point,
        type: newType,
        offers: [],
      },
    });
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

  setSavingState(isSaving) {
    this.updateElement({ isSaving });
  }

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
      this.#previousDestinationName = newDestinationName; // Обновляем предыдущее значение
    } else {
      evt.target.value = this.#previousDestinationName || '';
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

  #destinationInputHandler = (evt) => {
    const inputValue = evt.target.value;
    const validDestination = this.#destinations.find((dest) => dest.name === inputValue);
    if (!validDestination && inputValue !== '') {
      evt.target.value = this.#previousDestinationName || '';
    }
  };

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
