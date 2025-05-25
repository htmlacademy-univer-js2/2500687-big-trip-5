import FiltersView from '../view/filters-view.js';
import { render, replace } from '../framework/render.js';

export default class FilterPresenter {
  #container = null;
  #filterModel = null;
  #tripModel = null;
  #filterComponent = null;

  constructor({ container, filterModel, tripModel }) {
    this.#container = container;
    this.#filterModel = filterModel;
    this.#tripModel = tripModel;
  }

  init() {
    const points = this.#tripModel.getAllPoints();
    const currentFilter = this.#filterModel.getFilter();

    this.#filterComponent = new FiltersView(points, currentFilter, this.#handleFilterChange.bind(this));
    render(this.#filterComponent, this.#container);
  }

  #handleFilterChange(filterType) {
    this.#filterModel.setFilter(filterType);

    // Перерендерим FiltersView с новыми данными
    const newFilterComponent = new FiltersView(
      this.#tripModel.getAllPoints(),
      filterType,
      this.#handleFilterChange.bind(this)
    );
    replace(newFilterComponent, this.#filterComponent);
    this.#filterComponent = newFilterComponent;
  }
}
