export default class DestinationsModel {
  #destinations = [];

  constructor(destinations) {
    this.#destinations = destinations || [];
  }

  getDestinations() {
    return [...this.#destinations];
  }

  setDestinations(destinations) {
    this.#destinations = [...destinations];
  }

  getDestinationById(id) {
    return this.#destinations.find((dest) => String(dest.id) === String(id)) || null;
  }
}
