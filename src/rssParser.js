const parser = new DOMParser();

const channelKeys = ['title', 'link', 'description'];
const itemKeys = ['title', 'link', 'description', 'guid'];

const parseRSS = (node, keys) => keys.reduce((acc, key) => {
  const content = node.querySelector(key).textContent;
  if (!content) {
    return acc;
  }
  return { ...acc, [key]: content };
}, {});

export default (dataFromURL) => {
  const parsedData = parser.parseFromString(dataFromURL, 'application/xml');
  if (parsedData.documentElement.tagName !== 'rss') {
    throw new Error('Error parsing data');
  }
  const channelNode = parsedData.querySelector('channel');
  const itemNodes = parsedData.querySelectorAll('item');
  const channel = parseRSS(channelNode, channelKeys);
  const items = [...itemNodes].map(item => parseRSS(item, itemKeys));
  return { channel, items };
};
