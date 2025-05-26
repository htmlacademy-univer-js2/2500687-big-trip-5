/* eslint-disable camelcase */
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
    console.log(`Received ${points.length} points from server`, points);
    return points.map(this.#adaptPointToClient);
  }

  async getDestinations() {
    try {
      const response = await this._load({ url: 'destinations' });
      const destinations = await ApiService.parseResponse(response);
      console.log(`TripService: Received ${destinations.length} destinations from server`, destinations);
      return destinations;
    } catch (error) {
      console.error('TripService: Failed to fetch destinations', error);
      return [];
    }
  }

  async getOffers() {
    try {
      const response = await this._load({ url: 'offers' });
      const allOffers = await ApiService.parseResponse(response);
      console.log('Received offers from server', allOffers);
      return allOffers.reduce((acc, { type, offers }) => ({
        ...acc,
        [type.toLowerCase()]: offers,
      }), {});
    } catch (error) {
      return {};
    }
  }

  async updatePoint(point) {
    try {
      const serverPoint = this.#adaptPointToServer(point);
      console.log(`TripService: Sending PUT request to /points/${point.id}`, serverPoint);
      const response = await this._load({
        url: `points/${point.id}`,
        method: 'PUT',
        body: JSON.stringify(serverPoint),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      const updatedPoint = await ApiService.parseResponse(response);
      console.log('TripService: Point updated', updatedPoint);
      return this.#adaptPointToClient(updatedPoint);
    } catch (error) {
      console.error('TripService: Failed to update point', error);
      throw error;
    }
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
      base_price: clientPoint.basePrice,
      date_from: clientPoint.dateFrom,
      date_to: clientPoint.dateTo,
      destination: clientPoint.destinationId,
      is_favorite: clientPoint.isFavorite,
      offers: clientPoint.offers || [],
      type: String(clientPoint.type || '').toLowerCase(),
    };
  }
}
