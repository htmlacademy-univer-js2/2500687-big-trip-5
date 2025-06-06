import TripInfoView from '../view/trip-info-view.js';
import { render, replace, remove } from '../framework/render.js';
import dayjs from 'dayjs';

const formatDateForTripInfo = (date) => date ? dayjs(date).format('DD MMM').toUpperCase() : '';

export default class TripInfoPresenter {
  #container = null;
  #tripModel = null;
  #tripInfoComponent = null;

  constructor({ container, tripModel }) {
    this.#container = container;
    this.#tripModel = tripModel;

    this.#tripModel.addObserver(this.#handleModelUpdate);
  }

  init() {
    // Начальный рендер будет вызван после первого события от модели (INIT)
    // или если данные уже есть
    if (this.#tripModel.points.length > 0 || this.#tripModel.offersByType || this.#tripModel.destinations.length > 0) {
      this.#renderTripInfo();
    }
  }

  #prepareTripData() {
    const points = [...this.#tripModel.getAllPoints()].sort((a, b) => dayjs(a.dateFrom).diff(dayjs(b.dateFrom)));
    const destinations = this.#tripModel.destinations;
    const offersByType = this.#tripModel.offersByType;

    if (points.length === 0) {
      return { title: '', dates: '', cost: 0, isEmpty: true };
    }

    // Формирование маршрута
    let routeTitle = '';
    const cityNames = points
      .map((point) => destinations.find((dest) => dest.id === point.destinationId)?.name)
      .filter((name) => name);

    if (cityNames.length > 3) {
      routeTitle = `${cityNames[0]} — ... — ${cityNames[cityNames.length - 1]}`;
    } else {
      routeTitle = cityNames.join(' — ');
    }

    // Формирование дат
    let tripDates = '';
    const startDate = points[0].dateFrom;
    const endDate = points[points.length - 1].dateTo;

    if (startDate && endDate) {
      const startMonth = dayjs(startDate).format('MMM');
      const endMonth = dayjs(endDate).format('MMM');
      if (startMonth === endMonth) {
        tripDates = `${formatDateForTripInfo(startDate)} — ${dayjs(endDate).format('DD')}`;
      } else {
        tripDates = `${formatDateForTripInfo(startDate)} — ${formatDateForTripInfo(endDate)}`;
      }
    }


    // Расчет общей стоимости
    let totalCost = 0;
    points.forEach((point) => {
      totalCost += Number(point.basePrice) || 0;
      const pointTypeOffers = offersByType[point.type.toLowerCase()] || [];
      point.offers.forEach((offerId) => {
        const offer = pointTypeOffers.find((o) => String(o.id) === String(offerId));
        if (offer) {
          totalCost += Number(offer.price) || 0;
        }
      });
    });

    return { title: routeTitle, dates: tripDates, cost: totalCost, isEmpty: false };
  }

  #renderTripInfo() {
    const { title, dates, cost, isEmpty } = this.#prepareTripData();
    const prevTripInfoComponent = this.#tripInfoComponent;

    if (isEmpty && prevTripInfoComponent) { // Если точек нет, а компонент был, удаляем его
      remove(prevTripInfoComponent);
      this.#tripInfoComponent = null;
      return;
    }
    if (isEmpty && !prevTripInfoComponent) { // Если точек нет и компонента не было, ничего не делаем
      return;
    }

    // Если точки есть, создаем/обновляем компонент
    this.#tripInfoComponent = new TripInfoView({ title, dates, cost });

    if (prevTripInfoComponent) {
      replace(this.#tripInfoComponent, prevTripInfoComponent);
      remove(prevTripInfoComponent);
    } else {
      // Рендерим в начало контейнера .trip-main
      render(this.#tripInfoComponent, this.#container, 'afterbegin');
    }
  }

  #handleModelUpdate = (updateType) => {
    // Перерисовываем информацию о поездке при любых изменениях в модели,
    // которые могут повлиять на маршрут, даты или стоимость.
    switch (updateType) {
      case 'PATCH':
      case 'MINOR':
      case 'MAJOR':
      case 'INIT':
        this.#renderTripInfo();
        break;
    }
  };
}
