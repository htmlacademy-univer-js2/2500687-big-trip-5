import ApiService from './framework/api-service.js';

const BASE_URL = 'https://24.objects.htmlacademy.pro/big-trip';
const AUTHORIZATION = `Basic ${crypto.randomUUID().replace(/-/g, '')}`;

export default class TripService extends ApiService {
  constructor() {
    super(BASE_URL, AUTHORIZATION);
  }

  async getPoints() {
    const response = await this._load({ url: 'points' });
    const points = await ApiService.parseResponse(response);
    return points.map(this.#adaptPointToClient);
  }

  async getDestinations() {
    try {
      const response = await this._load({ url: 'destinations' });
      const destinations = await ApiService.parseResponse(response);
      return destinations;
    } catch (error) {
      return [];
    }
  }

  async getOffers() {
    try {
      const response = await this._load({ url: 'offers' });
      const allOffers = await ApiService.parseResponse(response);
      return allOffers.reduce((acc, { type, offers }) => ({
        ...acc,
        [type.toLowerCase()]: offers,
      }), {});
    } catch (error) {
      return {};
    }
  }

  async updatePoint(point) {
    const serverPoint = this.#adaptPointToServer(point);
    const response = await this._load({
      url: `points/${point.id}`,
      method: 'PUT',
      body: JSON.stringify(serverPoint),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    const updatedPoint = await ApiService.parseResponse(response);
    return this.#adaptPointToClient(updatedPoint);
  }

  async addPoint(point) {
    const serverPoint = this.#adaptPointToServer(point);
    const response = await this._load({
      url: 'points',
      method: 'POST',
      body: JSON.stringify(serverPoint),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    const newPoint = await ApiService.parseResponse(response);
    return this.#adaptPointToClient(newPoint);
  }

  async deletePoint(pointId) {
    const response = await this._load({
      url: `points/${pointId}`,
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete point: ${response.statusText}`);
    }
    return response;
  }

  #adaptPointToClient(serverPoint) {
    return {
      id: serverPoint.id,
      type: serverPoint.type,
      destinationId: serverPoint.destination,
      dateFrom: serverPoint.date_from,
      dateTo: serverPoint.date_to,
      basePrice: serverPoint.base_price,
      offers: serverPoint.offers || [],
      isFavorite: serverPoint.is_favorite,
    };
  }

  #adaptPointToServer(clientPoint) {
    return {
      id: clientPoint.id,
      type: String(clientPoint.type || '').toLowerCase(),
      'base_price': clientPoint.basePrice,
      'date_from': clientPoint.dateFrom,
      'date_to': clientPoint.dateTo,
      destination: clientPoint.destinationId,
      'is_favorite': clientPoint.isFavorite,
      offers: clientPoint.offers || []
    };
  }
}
