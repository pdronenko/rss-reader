export default () => {
  // idle, notURL, isDouble, isURL
  const inputState = 'idle';

  // loading, success, failure
  const feedRequestState = 'idle';

  // { feedID, feedTitle, feedDesc, feedURL }
  const feedList = [];

  // feedID: { itemTitle, itemLink, itemDesc, pubDate }
  const itemList = {};

  const activeFeedID = '';
  const prevFeedID = '';
  const activeFeedUpdated = false;

  return {
    inputState, feedRequestState, feedList, itemList, activeFeedID, prevFeedID, activeFeedUpdated,
  };
};
