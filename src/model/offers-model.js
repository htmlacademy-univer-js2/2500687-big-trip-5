export default class OffersModel {
  #offersByType = {};

  constructor(offersByType) {
    this.#offersByType = offersByType || {};
  }

  getOffersByType() {
    return { ...this.#offersByType };
  }

  setOffersByType(offersByType) {
    this.#offersByType = { ...offersByType };
  }

  getOffersForType(type) {
    return this.#offersByType[type] || [];
  }
}
