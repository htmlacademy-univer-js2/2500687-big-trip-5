export default class FilterModel {
  #currentFilter = 'everything'; // Значение по умолчанию
  #observers = [];

  getFilter() {
    return this.#currentFilter;
  }

  setFilter(filter) {
    this.#currentFilter = filter;
    this.#notifyObservers();
  }

  addObserver(observer) {
    this.#observers.push(observer);
  }

  removeObserver(observer) {
    this.#observers = this.#observers.filter((obs) => obs !== observer);
  }

  #notifyObservers() {
    this.#observers.forEach((observer) => observer());
  }
}
