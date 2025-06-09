import AbstractView from '../framework/view/abstract-view.js';

export default class EmptyListView extends AbstractView {
  #filterType = null;

  constructor(filterType) {
    super();
    this.#filterType = filterType || 'everything';
  }

  get template() {
    const messages = {
      everything: 'Click New Event to create your first point',
      past: 'There are no past events now',
      present: 'There are no present events now',
      future: 'There are no future events now',
    };

    const message = messages[this.#filterType] || messages.everything;

    return `
      <p class="trip-events__msg">${message}</p>
    `;
  }
}
