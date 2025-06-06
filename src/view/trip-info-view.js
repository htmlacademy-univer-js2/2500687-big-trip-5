import AbstractView from '../framework/view/abstract-view.js';
//import dayjs from 'dayjs';

//const formatDateForTripInfo = (date) => date ? dayjs(date).format('DD MMM') : '';

export default class TripInfoView extends AbstractView {
  #title = '';
  #dates = '';
  #cost = 0;

  constructor({ title, dates, cost }) {
    super();
    this.#title = title;
    this.#dates = dates;
    this.#cost = cost;
  }

  get template() {
    return `
      <section class="trip-main__trip-info  trip-info">
        <div class="trip-info__main">
          <h1 class="trip-info__title">${this.#title}</h1>
          <p class="trip-info__dates">${this.#dates}</p>
        </div>

        <p class="trip-info__cost">
          Total: &euro;&nbsp;<span class="trip-info__cost-value">${this.#cost}</span>
        </p>
      </section>
    `;
  }

  // Методы для обновления отдельных частей, если потребуется
  updateTitle(newTitle) {
    this.element.querySelector('.trip-info__title').textContent = newTitle;
  }

  updateDates(newDates) {
    this.element.querySelector('.trip-info__dates').textContent = newDates;
  }

  updateCost(newCost) {
    this.element.querySelector('.trip-info__cost-value').textContent = newCost;
  }
}
