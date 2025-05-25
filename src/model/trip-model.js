import DestinationsModel from './destinations-model.js';
import OffersModel from './offers-model.js';
import {isFuturePoint, isPresentPoint, isPastPoint} from '../mock/utils.js';
import dayjs from 'dayjs';

export default class TripModel {
  #points = [];
  #destinationsModel = null;
  #offersModel = null;
  #filterModel = null;
  #observers = [];

  constructor(data, filterModel) {
    this.#points = data.points;
    this.#destinationsModel = new DestinationsModel(data.destinations);
    this.#offersModel = new OffersModel(data.offersByType);
    this.#filterModel = filterModel;
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
    return [...this.#points];
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

  updatePoint(id, updatedPoint) {
    const index = this.#points.findIndex((point) => point.id === id);
    if (index === -1) {
      this.#points.push(updatedPoint);
    } else {
      this.#points[index] = { ...updatedPoint }; // Создаём копию, чтобы избежать мутаций
    }
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
