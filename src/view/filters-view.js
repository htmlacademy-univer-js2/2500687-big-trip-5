import AbstractView from '../framework/view/abstract-view.js';
import {isFuturePoint, isPresentPoint, isPastPoint} from '../mock/utils.js';

export default class FiltersView extends AbstractView{
  #points = [];
  #handleFilterChange = null;
  #currentFilterType = null;

  constructor(points, currentFilterType, onFilterChange) {
    super();
    this.#points = points || [];
    this.#currentFilterType = currentFilterType || 'everything';
    this.#handleFilterChange = onFilterChange;

    this.element.addEventListener('change', this.#filterChangeHandler);
  }

  get template() {
    const hasFuturePoints = this.#points.some((point) => isFuturePoint(point));
    const hasPresentPoints = this.#points.some((point) => isPresentPoint(point));
    const hasPastPoints = this.#points.some((point) => isPastPoint(point));
    const hasPoints = this.#points.length > 0;
    return `
      <form class="trip-filters" action="#" method="get">
    <div class="trip-filters__filter">
      <input id="filter-everything" class="trip-filters__filter-input visually-hidden" type="radio" name="trip-filter" value="everything" ${this.#currentFilterType === 'everything' ? 'checked' : ''} ${hasPoints ? '' : 'disabled'}>
      <label class="trip-filters__filter-label" for="filter-everything">Everything</label>
    </div>

    <div class="trip-filters__filter">
      <input id="filter-future" class="trip-filters__filter-input visually-hidden" type="radio" name="trip-filter" value="future" ${this.#currentFilterType === 'future' ? 'checked' : ''} ${hasFuturePoints ? '' : 'disabled'}>
      <label class="trip-filters__filter-label" for="filter-future">Future</label>
    </div>

    <div class="trip-filters__filter">
      <input id="filter-present" class="trip-filters__filter-input visually-hidden" type="radio" name="trip-filter" value="present" ${this.#currentFilterType === 'present' ? 'checked' : ''} ${hasPresentPoints ? '' : 'disabled'}>
      <label class="trip-filters__filter-label" for="filter-present">Present</label>
    </div>

    <div class="trip-filters__filter">
      <input id="filter-past" class="trip-filters__filter-input visually-hidden" type="radio" name="trip-filter" value="past" ${this.#currentFilterType === 'past' ? 'checked' : ''} ${hasPastPoints ? '' : 'disabled'}>
      <label class="trip-filters__filter-label" for="filter-past">Past</label>
    </div>

    <button class="visually-hidden" type="submit">Accept filter</button>
  </form>
    `;
  }

  #filterChangeHandler = (evt) => {
    evt.preventDefault();
    const newFilterType = evt.target.value;
    this.#handleFilterChange(newFilterType);
  };
}
