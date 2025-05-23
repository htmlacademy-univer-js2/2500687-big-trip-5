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

  constructor(destinations, offersByType, onFormSubmit, onCancelClick) {
    super();
    this.#destinations = destinations || [];
    this.#offersByType = offersByType || {};
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCancelClick = onCancelClick;

    // Инициализируем состояние с дефолтными значениями
    const defaultType = 'Flight';
    const defaultDestination = this.#destinations[0] || { name: '', description: '', pictures: [] };
    const defaultDate = new Date(); // Текущая дата и время
    this._state = {
      point: {
        type: defaultType,
        destinationId: defaultDestination.id || null,
        dateFrom: defaultDate.toISOString(), // Устанавливаем текущую дату как начальную
        dateTo: dayjs(defaultDate).add(1, 'hour').toISOString(), // Устанавливаем дату через час как конечную
        basePrice: '',
        offers: [],
      },
    };

    // Навешиваем обработчики
    this._restoreHandlers();
    this.#initFlatpickr(); // Инициализация flatpickr
  }

  get template(){
    const { type, destinationId, dateFrom, dateTo, basePrice, offers } = this._state.point;
    const destination = this.#destinations.find((dest) => dest.id === destinationId) || { name: '', description: '', pictures: [] };
    const availableOffers = this.#offersByType[type] || [];

    // Форматируем даты для отображения в flatpickr
    const formattedDateFrom = dateFrom ? dayjs(dateFrom).format('DD/MM/YY HH:mm') : '';
    const formattedDateTo = dateTo ? dayjs(dateTo).format('DD/MM/YY HH:mm') : '';

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
              <input class="event__input event__input--price" id="event-price-1" type="text" name="event-price" value="${basePrice}">
            </div>
            <button class="event__save-btn btn btn--blue" type="submit">Save</button>
            <button class="event__reset-btn" type="reset">Cancel</button>
          </header>
          <section class="event__details">
            ${availableOffers.length > 0 ? `
              <section class="event__section event__section--offers">
                <h3 class="event__section-title event__section-title--offers">Offers</h3>
                <div class="event__available-offers">
                  ${availableOffers.map((offer) => `
                    <div class="event__offer-selector">
                      <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-1" type="checkbox" name="event-offer-${offer.id}" ${offers.includes(offer.id) ? 'checked' : ''}>
                      <label class="event__offer-label" for="event-offer-${offer.id}-1">
                        <span class="event__offer-title">${offer.title}</span>
                        +€ <span class="event__offer-price">${offer.price}</span>
                      </label>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}
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
          </section>
        </form>
      </li>
    `;
  }

  #initFlatpickr() {
    const startInput = this.element.querySelector('#event-start-time-1');
    const endInput = this.element.querySelector('#event-end-time-1');

    // Настройки flatpickr
    const flatpickrOptions = {
      dateFormat: 'd/m/y H:i', // Формат согласно техзаданию: DD/MM/YY HH:mm
      enableTime: true, // Включаем выбор времени
      time24hr: true, // 24-часовой формат
      defaultDate: this._state.point.dateFrom || this._state.point.dateTo || new Date(), // Устанавливаем начальную дату
      minDate: 'today', // Ограничиваем выбор с сегодняшнего дня
      onChange: (selectedDates, dateStr, instance) => {
        const field = instance.element.id === 'event-start-time-1' ? 'dateFrom' : 'dateTo';
        this.updateElement({
          point: {
            ...this._state.point,
            [field]: selectedDates[0] ? selectedDates[0].toISOString() : null,
          },
        });

        // Синхронизация: если выбрана новая дата начала, обновляем минимальную дату для конца
        if (field === 'dateFrom' && this.#flatpickrEnd) {
          this.#flatpickrEnd.set('minDate', selectedDates[0]);
        }
      },
    };

    // Инициализация flatpickr
    this.#flatpickrStart = flatpickr(startInput, flatpickrOptions);
    this.#flatpickrEnd = flatpickr(endInput, { ...flatpickrOptions, minDate: this._state.point.dateFrom || 'today' });

    // Устанавливаем начальные значения
    if (this._state.point.dateFrom) {
      this.#flatpickrStart.setDate(dayjs(this._state.point.dateFrom).toDate());
    }
    if (this._state.point.dateTo) {
      this.#flatpickrEnd.setDate(dayjs(this._state.point.dateTo).toDate());
    }
  }

  _restoreHandlers() {
    // Обработчик отправки формы
    this.element.querySelector('form.event--edit').addEventListener('submit', this.#formSubmitHandler);

    // Обработчик кнопки "Cancel"
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#cancelClickHandler);

    // Обработчик смены типа точки
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);

    // Обработчик смены пункта назначения
    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationChangeHandler);
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit();
  };

  #cancelClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleCancelClick();
  };

  #typeChangeHandler = (evt) => {
    const newTypeLower = evt.target.value.toLowerCase();
    // Находим ключ в #offersByType, игнорируя регистр
    const newType = Object.keys(this.#offersByType).find(
      (key) => key.toLowerCase() === newTypeLower
    ) || newTypeLower.charAt(0).toUpperCase() + newTypeLower.slice(1);
    this.updateElement({
      point: {
        ...this._state.point,
        type: newType,
        offers: [], // Сбрасываем выбранные опции при смене типа
      },
    });
  };

  #destinationChangeHandler = (evt) => {
    const newDestinationName = evt.target.value;
    const newDestination = this.#destinations.find((dest) => dest.name === newDestinationName);
    this.updateElement({
      point: {
        ...this._state.point,
        destinationId: newDestination.id,
      },
    });
  };
}
