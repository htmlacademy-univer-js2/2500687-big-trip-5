import FiltersView from '../view/filters-view.js';
import {render, replace, remove} from '../framework/render.js';

export default class FilterPresenter {
  #container = null;
  #filterModel = null;
  #tripModel = null;
  #filterComponent = null;

  constructor({container, filterModel, tripModel}) {
    this.#container = container;
    this.#filterModel = filterModel;
    this.#tripModel = tripModel;

    this.#filterModel.addObserver(this.#filterModelUpdateHandler);
    this.#tripModel.addObserver(this.#filterModelUpdateHandler);
  }

  init() {
    this.#renderFilterComponent();
  }

  #renderFilterComponent() {
    const points = this.#tripModel.points;
    const currentFilter = this.#filterModel.getFilter();
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FiltersView(
      points,
      currentFilter,
      this.#filterTypeSelectHandler
    );

    if (prevFilterComponent) {
      replace(this.#filterComponent, prevFilterComponent);
      remove(prevFilterComponent);
    } else {
      render(this.#filterComponent, this.#container);
    }
  }

  #filterTypeSelectHandler = (filterType) => {
    this.#filterModel.setFilter(filterType);
  };

  #filterModelUpdateHandler = () => {
    this.#renderFilterComponent();
  };
}
