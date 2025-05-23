import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';


export default class TripFormCreate extends AbstractStatefulView {
  #destinations = [];
  #offersByType = {};
  #handleFormSubmit = null;
  #handleCancelClick = null;

  constructor(destinations, offersByType, onFormSubmit, onCancelClick) {
    super();
    this.#destinations = destinations || [];
    this.#offersByType = offersByType || {};
    this.#handleFormSubmit = onFormSubmit;
    this.#handleCancelClick = onCancelClick;

    // Инициализируем состояние с дефолтными значениями
    const defaultType = 'Flight';
    const defaultDestination = this.#destinations[0] || { name: '', description: '', pictures: [] };
    this._state = {
      point: {
        type: defaultType,
        destinationId: defaultDestination.id || null,
        //dateFrom: '',
        //dateTo: '',
        //basePrice: '',
        offers: [],
      },
    };

    // Навешиваем обработчики
    this._restoreHandlers();
  }

  get template(){
    const {type, destinationId, offers} = this._state.point;
    const destination = this.#destinations.find((dest) => dest.id === destinationId) || { name: '', description: '', pictures: [] };
    const availableOffers = this.#offersByType[type] || [];
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
              <input class="event__input event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="">
              —
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input class="event__input event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="">
            </div>
            <div class="event__field-group event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                €
              </label>
              <input class="event__input event__input--price" id="event-price-1" type="text" name="event-price" value="">
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
    //console.log('Checking offers for type in TripFormCreate:', newType, 'Available:', this.#offersByType[newType]);
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
    if (newDestination) {
      this.updateElement({
        point: {
          ...this._state.point,
          destinationId: newDestination.id,
        },
      });
    } else {
      //console.log(`Destination not found in TripFormCreate: ${newDestinationName}`);
    }
  };
}
