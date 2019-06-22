export default () => {
  const inputState = 'idle';
  const feedRequestState = 'idle';
  const feedList = [];
  const itemList = {};
  const activeFeedID = '';
  const prevFeedID = '';
  const activeFeedUpdated = false;

  return {
    inputState, feedRequestState, feedList, itemList, activeFeedID, prevFeedID, activeFeedUpdated,
  };
};
