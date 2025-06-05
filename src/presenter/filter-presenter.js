import FiltersView from '../view/filters-view.js';
import {render, replace, remove} from '../framework/render.js';

export default class FilterPresenter {
  #container = null;
  #filterModel = null;
  #tripModel = null;
  #filterComponent = null;

  constructor({ container, filterModel, tripModel }) {
    this.#container = container;
    this.#filterModel = filterModel;
    this.#tripModel = tripModel;

    // Подписываемся на изменения модели фильтра
    this.#filterModel.addObserver(this.#handleFilterModelUpdate);
    // Подписываемся на изменения модели путешествий (когда меняется список точек)
    this.#tripModel.addObserver(this.#handleFilterModelUpdate);
  }

  init() {
    // Первоначальный рендер компонента фильтров
    this.#renderFilterComponent();
  }

  #renderFilterComponent() {
    const points = this.#tripModel.getAllPoints(); // Получаем ВСЕ точки для логики disabled
    const currentFilter = this.#filterModel.getFilter(); // Получаем ТЕКУЩИЙ фильтр из модели
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FiltersView(
      points,
      currentFilter,
      this.#handleFilterChange
    );

    if (prevFilterComponent) {
      replace(this.#filterComponent, prevFilterComponent);
      remove(prevFilterComponent);
    } else {
      render(this.#filterComponent, this.#container);
    }
  }

  #handleFilterChange = (filterType) => {
    this.#filterModel.setFilter(filterType);
  };

  #handleFilterModelUpdate = () => {
    this.#renderFilterComponent(); // Перерисовываем компонент фильтров с актуальным состоянием
  };
}
