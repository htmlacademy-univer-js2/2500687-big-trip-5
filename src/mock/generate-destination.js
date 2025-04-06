import {getRandomInt, getRandomArrayElement} from './utils';

const DESCRIPTION_TEXT = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Cras aliquet varius magna, non porta ligula feugiat eget.',
  'Fusce tristique felis at fermentum pharetra.',
  'Aliquam id orci ut lectus varius viverra.',
  'Nullam nunc ex, convallis sed finibus eget, sollicitudin eget ante.',
  'Phasellus eros mauris, condimentum sed nibh vitae, sodales efficitur ipsum.',
  'Sed blandit, eros vel aliquam faucibus, purus ex euismod diam, eu luctus nunc ante ut dui.',
  'Sed sed nisi sed augue convallis suscipit in sed felis.',
  'Aliquam erat volutpat.',
  'Nunc fermentum tortor ac porta dapibus.',
  'In rutrum ac purus sit amet tempus.'
];

const CITIES = ['Geneva', 'Paris', 'Amsterdam', 'Chamonix', 'London', 'Berlin', 'Madrid'];

const generateDescription = () => {
  const sentenceCount = getRandomInt(1, 3);
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(getRandomArrayElement(DESCRIPTION_TEXT));
  }
  return sentences.join(' ');
};

const generatePictures = () => {
  const pictureCount = getRandomInt(1, 5);
  const pictures = [];
  for (let i = 0; i < pictureCount; i++) {
    pictures.push({
      src: `https://loremflickr.com/248/152?random=${getRandomInt(1, 100)}`,
      description: 'Event photo'
    });
  }
  return pictures;
};

export const generateDestination = (id) => ({
  id: String(id),
  name: getRandomArrayElement(CITIES),
  description: generateDescription(),
  pictures: generatePictures()
});
