export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getRandomArrayElement = (array) => array[getRandomInt(0, array.length - 1)];

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

export const generateDescription = () => {
  const sentenceCount = getRandomInt(1, 3);
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(getRandomArrayElement(DESCRIPTION_TEXT));
  }
  return sentences.join(' ');
};

export const generatePictures = () => {
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

export const formatDate = (date) => date.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

export const formatTime = (date) => date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export const getDuration = (startDate, endDate) => {
  const diffMs = endDate - startDate;
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return `${days}D ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
  }
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
  }
  return `${minutes}M`;
};

export const formatDateTime = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
