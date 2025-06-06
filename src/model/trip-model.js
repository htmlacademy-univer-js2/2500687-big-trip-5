import Observable from '../framework/observable.js';
import TripService from '../api.js';
import DestinationsModel from './destinations-model.js';
import OffersModel from './offers-model.js';
import {isFuturePoint, isPresentPoint, isPastPoint} from '../mock/utils.js';
import dayjs from 'dayjs';

const UpdateType = { // Типы обновлений
  PATCH: 'PATCH',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  INIT: 'INIT',
};

export default class TripModel extends Observable {
  #tripService = null;
  #points = [];
  #destinationsModel = null;
  #offersModel = null;
  #filterModel = null;

  constructor(filterModel) {
    super();
    this.#tripService = new TripService();
    this.#destinationsModel = new DestinationsModel();
    this.#offersModel = new OffersModel();
    this.#filterModel = filterModel;
  }

  async init() {
    try {
      await Promise.all([
        this.#destinationsModel.init(),
        this.#offersModel.init(),
      ]);
      const points = await this.#tripService.getPoints();
      this.#points = points;
      this._notify(UpdateType.INIT);
    } catch (error) {
      this.#points = [];
      this.#destinationsModel.setDestinations([]);
      this.#offersModel.setOffersByType({});
      this._notify(UpdateType.INIT, {error: true}); // Уведомляем об ошибке инициализации
    }
  }


  get points() {
    const currentFilter = this.#filterModel.getFilter();
    const currentDate = dayjs(); //Текущая дата
    switch (currentFilter) {
      case 'everything':
        return [...this.#points];
      case 'future':
        return this.#points.filter((point) => isFuturePoint(point, currentDate));
      case 'present':
        return this.#points.filter((point) => isPresentPoint(point, currentDate));
      case 'past':
        return this.#points.filter((point) => isPastPoint(point, currentDate));
      default:
        return [...this.#points];
    }
  }

  getAllPoints() {
    return this.#points;
  }

  // Запись точек маршрута
  setPoints(points) {
    this.#points = [...points]; // Перезаписываем массив
    this._notify(UpdateType.MAJOR);
  }

  get destinations() {
    return this.#destinationsModel.getDestinations();
  }

  get offersByType() {
    return this.#offersModel.getOffersByType();
  }

  getDestinationById(id) {
    return this.#destinationsModel.getDestinationById(id);
  }

  getOffersForPointType(type) {
    return this.#offersModel.getOffersForType(type);
  }

  async updatePoint(updateType, update) {
    try {
      const updatedPoint = await this.#tripService.updatePoint(update);
      const index = this.#points.findIndex((point) => point.id === updatedPoint.id);
      if (index === -1) {
        throw new Error('Point not found for update');
      }
      this.#points = [
        ...this.#points.slice(0, index),
        updatedPoint,
        ...this.#points.slice(index + 1),
      ];
      this._notify(updateType, updatedPoint);
    } catch (error) {
      throw new Error(`Can't update point: ${error.message}`);
    }
  }

  async addPoint(updateType, newPointData) {
    try {
      const createdPoint = await this.#tripService.addPoint(newPointData);
      this.#points.unshift(createdPoint);
      this._notify(updateType, createdPoint);
    } catch (error) {
      throw new Error(`Can't add point: ${error.message}`);
    }
  }

  async deletePoint(updateType, pointId) {
    try {
      await this.#tripService.deletePoint(pointId);
      const index = this.#points.findIndex((point) => point.id === pointId);
      if (index === -1) {
        throw new Error('Point not found for deletion in local cache');
      }
      this.#points.splice(index, 1);
      this._notify(updateType, {id: pointId}); // Передаем ID удаленной точки
    } catch (error) {
      throw new Error(`Can't delete point: ${error.message}`);
    }
  }
}
