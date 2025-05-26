import TripService from '../api.js';

export default class OffersModel {
  #offersByType = {};
  #tripService = null;

  constructor() {
    this.#tripService = new TripService();
  }

  async init() {
    try {
      this.#offersByType = await this.#tripService.getOffers();
    } catch (error) {
      this.#offersByType = {};
    }
  }

  getOffersByType() {
    return { ...this.#offersByType };
  }

  setOffersByType(offersByType) {
    this.#offersByType = { ...offersByType };
  }

  getOffersForType(type) {
    return this.#offersByType[type.toLowerCase()] || [];
  }
}
