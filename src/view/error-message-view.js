import AbstractView from '../framework/view/abstract-view';

export default class ErrorMessageView extends AbstractView {

  get template() {
    return `
    <p class="trip-events__msg">Failed to load latest route information</p>
    `;
  }
}
