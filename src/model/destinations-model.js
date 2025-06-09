import TripService from '../api.js';

export default class DestinationsModel {
  #destinations = [];
  #tripService = null;

  constructor() {
    this.#tripService = new TripService();
  }

  async init() {
    try {
      this.#destinations = await this.#tripService.getDestinations();
    } catch (error) {
      this.#destinations = [];
    }
  }

  getDestinations() {
    return [...this.#destinations];
  }

  setDestinations(destinations) {
    this.#destinations = [...destinations];
  }

  getDestinationById(id) {
    return this.#destinations.find((dest) => String(dest.id) === String(id)) || {name: '', description: '', pictures: []};
  }
}
