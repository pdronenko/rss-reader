export default () => {
  // buttonStatus: on, off, loading || inputState: idle, notURL, isDouble, isURL
  const formState = { inputText: '', buttonState: 'off', inputState: 'idle' };

  // type: isDouble, wrongURL, feedAdded
  const alertState = { type: '', alertCount: 0 };

  // feed - { url, title, desc,
  // items: [{ title, link, desc, pubDate }, { title, link, desc, pubDate }] }
  const feedListState = {
    currentFeedURL: '', prevFeedURL: '', addedFeedsCount: 0, activeFeedItemsCount: 0, feedList: [],
  };

  const modalInfo = { desc: '' };

  return {
    formState, alertState, feedListState, modalInfo,
  };
};
