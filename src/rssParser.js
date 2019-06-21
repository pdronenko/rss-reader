import { sortBy } from 'lodash';

const parser = new DOMParser();

export default (dataFromURL) => {
  const isDomParserError = parsedData => parsedData.getElementsByTagName('parsererror').length > 0;
  const isAtomFeedType = parsedData => parsedData.getElementsByTagName('entry').length > 0;

  const parsedData = parser.parseFromString(dataFromURL, 'application/xml');
  if (isDomParserError(parsedData)) {
    throw new Error('error parsing data');
  }
  if (isAtomFeedType(parsedData)) {
    throw new Error('Atom feeds are not supported');
  }
  const feedTitle = parsedData.querySelector('channel title').textContent;
  const feedDesc = parsedData.querySelector('channel description').textContent;
  const itemsNodeList = parsedData.querySelectorAll('item');

  const items = Array.from(itemsNodeList).map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemDesc = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;
    const pubDate = item.querySelector('pubDate').textContent;
    return {
      itemTitle, itemLink, itemDesc, pubDate,
    };
  });
  const sortedItems = sortBy(items, ['pubDate']);

  return { feedTitle, feedDesc, items: sortedItems };
};
