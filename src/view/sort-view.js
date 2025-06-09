import AbstractView from '../framework/view/abstract-view.js';

export default class SortView extends AbstractView {
  #currentSortType = 'day';
  #disabledSortTypes = ['event', 'offer'];
  #onSortTypeChange = null;

  constructor({currentSortType, disabledSortTypes, onSortTypeChange} = {}) {
    super();
    this.#currentSortType = currentSortType || 'day';
    this.#disabledSortTypes = disabledSortTypes || ['event', 'offer'];
    this.#onSortTypeChange = onSortTypeChange;

    this.element.addEventListener('click', this.#sortTypeChangeHandler);
  }

  get template() {
    const sortOptions = [
      {type: 'day', label: 'Day'},
      {type: 'event', label: 'Event'},
      {type: 'time', label: 'Time'},
      {type: 'price', label: 'Price'},
      {type: 'offer', label: 'Offers'},
    ];
    return `
      <form class="trip-sort" action="#" method="get">
        ${sortOptions.map((option) => `
          <div class="trip-sort__item trip-sort__item--${option.type}">
            <input
              id="sort-${option.type}"
              class="trip-sort__input visually-hidden"
              type="radio"
              name="trip-sort"
              value="sort-${option.type}"
              ${this.#currentSortType === option.type ? 'checked' : ''}
              ${this.#disabledSortTypes.includes(option.type) ? 'disabled' : ''}
              data-sort-type="${option.type}"
            >
            <label class="trip-sort__btn" for="sort-${option.type}">${option.label}</label>
          </div>
        `).join('')}
      </form>
    `;
  }

  #sortTypeChangeHandler = (evt) => {
    const input = evt.target.closest('input');
    if (!input || input.disabled) {
      return;
    }

    const sortType = input.dataset.sortType;
    if (sortType && this.#onSortTypeChange) {
      this.#onSortTypeChange(sortType);
    }
  };
}
