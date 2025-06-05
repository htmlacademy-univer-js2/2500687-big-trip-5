import AbstractView from '../framework/view/abstract-view.js';

export default class LoadingView extends AbstractView {
  get template() {
    // Берем только необходимую часть из loading.html
    return '<p class="trip-events__msg">Loading...</p>';
  }
}
