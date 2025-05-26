import Observable from '../framework/observable.js';
import TripService from '../api.js';
import DestinationsModel from './destinations-model.js';
import OffersModel from './offers-model.js';
import {isFuturePoint, isPresentPoint, isPastPoint} from '../mock/utils.js';
import dayjs from 'dayjs';

export default class TripModel extends Observable {
  #tripService = null;
  #points = [];
  #destinationsModel = null;
  #offersModel = null;
  #filterModel = null;
  #observers = [];

  constructor(filterModel) {
    super();
    this.#tripService = new TripService();
    this.#destinationsModel = new DestinationsModel();
    this.#offersModel = new OffersModel();
    this.#filterModel = filterModel;
  }

  async init() {
    try {
      const [points] = await Promise.all([
        this.#tripService.getPoints(),
        this.#destinationsModel.init(),
        this.#offersModel.init(),
      ]);
      this.#points = points;
    } catch (error) {
      this.#points = [];
      this.#destinationsModel.setDestinations([]);
      this.#offersModel.setOffersByType({});
    }
    this._notify('INIT');
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
    this.#notifyObservers();
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

  getOffersByType(type) {
    return this.#offersModel.getOffersForType(type);
  }

  async updatePoint(updateType, update) {
    const updatedPoint = await this.#tripService.updatePoint(update);
    const index = this.#points.findIndex((point) => point.id === updatedPoint.id);
    if (index === -1) {
      throw new Error('Point not found');
    }
    this.#points = [
      ...this.#points.slice(0, index),
      updatedPoint,
      ...this.#points.slice(index + 1),
    ];
    this.#notifyObservers();
  }

  deletePoint(id) {
    const index = this.#points.findIndex((point) => point.id === id);
    if (index !== -1) {
      this.#points.splice(index, 1);
      this.#notifyObservers(); // Уведомляем наблюдателей об изменении
    }
  }

  addPoint(newPoint) {
    this.#points.push(newPoint);
    this.#notifyObservers(); // Уведомляем наблюдателей об изменении
  }

  // Паттерн наблюдателя
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
