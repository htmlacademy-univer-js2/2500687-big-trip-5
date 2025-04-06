import {formatDate, formatTime, getDuration} from '../mock/utils';

export default class TripPoint {
  #point = null;
  #destination = null;
  #offers = [];

  constructor(point, destination, offers) {
    this.#point = point;
    this.#destination = destination;
    this.#offers = offers;
  }

  getTemplate(){
    const { type, dateFrom, dateTo, basePrice, isFavorite } = this.#point;
    const destinationName = this.#destination ? this.#destination.name : '';
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    return `
      <li class="trip-events__item">
              <div class="event">
                <time class="event__date" datetime="${dateFrom}">${formatDate(startDate)}</time>
                <div class="event__type">
                  <img class="event__type-icon" width="42" height="42" src="img/icons/${type.toLowerCase()}.png" alt="Event type icon">
                </div>
                <h3 class="event__title">${type} ${destinationName}</h3>
                <div class="event__schedule">
                  <p class="event__time">
                    <time class="event__start-time" datetime="${dateFrom}">${formatTime(startDate)}</time>
                    &mdash;
                    <time class="event__end-time" datetime="${dateTo}">${formatTime(endDate)}</time>
                  </p>
                  <p class="event__duration">${getDuration(startDate, endDate)}</p>
                </div>
                <p class="event__price">
                  &euro;&nbsp;<span class="event__price-value">${basePrice}</span>
                </p>
                <h4 class="visually-hidden">Offers:</h4>
                <ul class="event__selected-offers">
                  ${this.#offers.map((offer) => `
                    <li class="event__offer">
                      <span class="event__offer-title">${offer.title}</span>
                      +€ <span class="event__offer-price">${offer.price}</span>
                    </li>
                  `).join('')}
                </ul>
                <button class="event__favorite-btn ${isFavorite ? 'event__favorite-btn--active' : ''} type="button">
                  <span class="visually-hidden">Add to favorite</span>
                  <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
                    <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
                  </svg>
                </button>
                <button class="event__rollup-btn" type="button">
                  <span class="visually-hidden">Open event</span>
                </button>
              </div>
            </li>
    `;
  }

  getElement() {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    return element.firstElementChild;
  }
}
