import AbstractView from '../framework/view/abstract-view.js';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import he from 'he';
dayjs.extend(duration);

export default class TripPoint extends AbstractView {
  #point = null;
  #destination = null;
  #offers = [];
  #onEditClick = null;
  #onFavoriteClick = null;

  constructor(point, destination, offers, onEditClick, onFavoriteClick) {
    super();
    this.#point = point;
    this.#destination = destination;
    this.#offers = offers;
    this.#onEditClick = onEditClick;
    this.#onFavoriteClick = onFavoriteClick;

    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#editClickHandler);
    this.element.querySelector('.event__favorite-btn').addEventListener('click', this.#onFavoriteClick);
  }

  get template(){
    const {type, dateFrom, dateTo, basePrice, isFavorite} = this.#point;
    const destinationName = this.#destination ? this.#destination.name : '';

    const startTime = dayjs(dateFrom).format('HH:mm');
    const endTime = dayjs(dateTo).format('HH:mm');

    const durationMs = dayjs(dateTo).diff(dayjs(dateFrom));
    const durationObj = dayjs.duration(durationMs);

    const days = Math.floor(durationObj.asDays());
    const hours = durationObj.hours();
    const minutes = durationObj.minutes();

    let durationFormatted = '';
    if (days > 0) {
      durationFormatted = `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
    } else if (hours > 0) {
      durationFormatted = `${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
    } else {
      durationFormatted = `${minutes.toString().padStart(2, '0')}M`;
    }

    return `
      <li class="trip-events__item">
        <div class="event">
          <time class="event__date" datetime="${dateFrom}">${dayjs(dateFrom).format('MMM D')}</time>
          <div class="event__type">
            <img class="event__type-icon" width="42" height="42" src="img/icons/${type.toLowerCase()}.png" alt="Event type icon">
          </div>
          <h3 class="event__title">${he.encode(type)} ${he.encode(destinationName)}</h3>
          <div class="event__schedule">
            <p class="event__time">
              <time class="event__start-time" datetime="${dateFrom}">${startTime}</time>
              —
              <time class="event__end-time" datetime="${dateTo}">${endTime}</time>
            </p>
            <p class="event__duration">${durationFormatted}</p>
          </div>
          <p class="event__price">
            €<span class="event__price-value">${basePrice}</span>
          </p>
          <h4 class="visually-hidden">Offers:</h4>
          <ul class="event__selected-offers">
            ${this.#offers.map((offer) => `
              <li class="event__offer">
                <span class="event__offer-title">${he.encode(offer.title)}</span>
                +€<span class="event__offer-price">${offer.price}</span>
              </li>
            `).join('')}
          </ul>
          <button class="event__favorite-btn ${isFavorite ? 'event__favorite-btn--active' : ''}" type="button">
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

  #editClickHandler = (evt) => {
    evt.preventDefault();
    this.#onEditClick();
  };
}
