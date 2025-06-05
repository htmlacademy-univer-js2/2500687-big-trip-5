import TripPoint from '../view/trip-point.js';
import TripFormEdit from '../view/trip-form-editor.js';
import { render, replace, remove } from '../framework/render.js';

const UpdateType = {
  PATCH: 'PATCH', // Для небольших изменений, как 'favorite'
  MINOR: 'MINOR', // Для изменений, требующих перерисовки списка (удаление, существенное обновление)
};

export default class PointPresenter {
  #point = null;
  #destinations = [];
  #offersByType = {};
  #tripListComponent = null;
  #pointComponent = null;
  #pointEditComponent = null;
  #onEditStart = null;
  #isEditing = false;

  #tripModel = null; // Ссылка на модель
  #uiBlocker = null; // Ссылка на блокировщик

  constructor({point, destinations, offersByType, tripListComponent, onEditStart, tripModel, uiBlocker}) {
    this.#point = point;
    this.#destinations = destinations; // Это все destinations из модели
    this.#offersByType = offersByType; // Это все offersByType из модели
    this.#tripListComponent = tripListComponent;
    this.#onEditStart = onEditStart; // Колбэк для TripPresenter для закрытия других форм

    this.#tripModel = tripModel;
    this.#uiBlocker = uiBlocker;

    // Получаем данные для конкретной точки (destination, offers)
    const currentDestination = this.#tripModel.getDestinationById(this.#point.destinationId);
    const currentOffersForPoint = this.#tripModel.getOffersForPointType(this.#point.type)
      .filter((offer) => this.#point.offers.map(String).includes(String(offer.id)));

    this.#pointComponent = new TripPoint(
      this.#point,
      currentDestination,
      currentOffersForPoint,
      this.#handleEditClick,
      this.#handleFavoriteClick // Передаем обработчик favorite
    );
  }

  // render() вызывается из TripPresenter при создании экземпляра PointPresenter
  render() {
    if (this.#pointComponent && this.#tripListComponent.element) {
      render(this.#pointComponent, this.#tripListComponent.element);
    }
  }

  resetView() {
    if (this.#isEditing) {
      if (this.#pointEditComponent && this.#pointEditComponent.element.parentElement) {
        replace(this.#pointComponent, this.#pointEditComponent);
        this.#destroyEditComponent();
      }
      document.removeEventListener('keydown', this.#escKeyDownHandler);
      this.#isEditing = false;
    }
  }

  switchToEditMode() {
    if (this.#isEditing) {
      return;
    }
    this.#pointEditComponent = new TripFormEdit(
      this.#point, // Текущая точка для редактирования
      this.#destinations, // Все пункты назначения
      this.#offersByType, // Все предложения по типам
      this.#handleFormSubmit,
      this.#handleRollupClick,
      this.#handleDeleteClick
    );
    replace(this.#pointEditComponent, this.#pointComponent);
    document.addEventListener('keydown', this.#escKeyDownHandler);
    this.#onEditStart(this.#point.id); // Уведомляем TripPresenter, что эта точка редактируется
    this.#isEditing = true;
  }

  updatePoint(updatedPoint) {
    const prevPointComponent = this.#pointComponent;
    this.#point = updatedPoint;
    const currentDestination = this.#tripModel.getDestinationById(this.#point.destinationId);
    const currentOffersForPoint = this.#tripModel.getOffersForPointType(this.#point.type)
      .filter((offer) => this.#point.offers.map(String).includes(String(offer.id)));

    this.#pointComponent = new TripPoint(
      this.#point,
      currentDestination,
      currentOffersForPoint,
      this.#handleEditClick,
      this.#handleFavoriteClick
    );

    if (prevPointComponent.element?.parentElement) {
      replace(this.#pointComponent, prevPointComponent);
      remove(prevPointComponent);
    } else {
      render(this.#pointComponent, this.#tripListComponent.element);
    }
  }

  #destroyEditComponent() {
    if (this.#pointEditComponent) {
      remove(this.#pointEditComponent);
      this.#pointEditComponent = null;
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    remove(this.#pointComponent);
    this.#destroyEditComponent();
    this.#pointComponent = null;
  }

  #handleEditClick = () => {
    this.switchToEditMode();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.#pointEditComponent.resetToInitialState(); // Сначала сброс данных формы
      this.resetView(); // Затем закрытие
    }
  };

  #handleFormSubmit = async (updatedPoint) => {
    // Проверяем, были ли изменения. Если нет, просто закрываем форму.
    const isDataChanged = JSON.stringify(this.#point) !== JSON.stringify(updatedPoint);
    if (!isDataChanged && !this.#pointEditComponent._state.isSaving) {
      this.resetView();
      return;
    }

    this.#uiBlocker.block();
    this.#pointEditComponent.setSavingState(true);
    try {
      await this.#tripModel.updatePoint(UpdateType.MINOR, updatedPoint);
      this.resetView(); // Закрываем форму после успешного сохранения
    } catch (error) {
      this.#pointEditComponent.shake(() => {
        this.#pointEditComponent.setSavingState(false);
      });
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #handleRollupClick = () => {
    this.#pointEditComponent.resetToInitialState();
    this.resetView();
  };

  #handleDeleteClick = async () => {
    this.#uiBlocker.block();
    this.#pointEditComponent.setDeletingState(true);
    try {
      await this.#tripModel.deletePoint(UpdateType.MINOR, this.#point.id);
    } catch (error) {
      this.#pointEditComponent.shake(() => {
        this.#pointEditComponent.setDeletingState(false);
      });
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #handleFavoriteClick = async () => {
    const updatedPoint = {
      id: this.#point.id,
      type: this.#point.type,
      destinationId: this.#point.destinationId,
      dateFrom: this.#point.dateFrom,
      dateTo: this.#point.dateTo,
      basePrice: this.#point.basePrice,
      offers: this.#point.offers,
      isFavorite: !this.#point.isFavorite,
    };
    // Не блокируем UI для favorite, только shake при ошибке
    try {
      await this.#tripModel.updatePoint(UpdateType.PATCH, updatedPoint);
      // Модель обновится, TripPresenter перерисует (или только эту точку)
    } catch (error) {
      // Эффект «покачивание головой» применяется к карточке точки маршрута
      this.#pointComponent.shake();
    }
  };
}
