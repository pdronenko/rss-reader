import { differenceBy, chunk, uniqueId } from 'lodash';
import { isURL } from 'validator';
import axios from 'axios';
import getState from './states';
import parseRSS from './rssParser';


export const state = getState();
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const getDataFromUrl = (url, feedID = uniqueId()) => axios
  .get(`${corsProxy}${url}`)
  .then(({ data }) => parseRSS(data, feedID));

export const updateInputState = (value) => {
  const urlCheckersList = [
    {
      inputStateName: 'idle',
      check: inputURL => inputURL === '',
    },
    {
      inputStateName: 'notURL',
      check: inputURL => !isURL(inputURL),
    },
    {
      inputStateName: 'isDouble',
      check: inputURL => state.feedList.some(({ feedURL }) => inputURL === feedURL),
    },
    {
      inputStateName: 'isURL',
      check: isURL,
    },
  ];
  const { inputStateName } = urlCheckersList.find(({ check }) => check(value));
  state.inputState = inputStateName;
};

const updateFeedItems = () => {
  state.activeFeedUpdated = false;
  const sizeOfFeedsChunk = 10;
  const chunksOfFeeds = chunk(state.feedList, sizeOfFeedsChunk);
  const iter = (chunks) => {
    if (chunks.length === 0) {
      setTimeout(updateFeedItems, 5000);
      return;
    }
    const promises = chunks[0].map(({ feedURL, feedID }) => getDataFromUrl(feedURL, feedID)x);
    Promise.all(promises)
      .then((values) => {
        values.forEach(({ items, feedID }) => {
          const oldItems = state.itemList[feedID];
          const addedItems = differenceBy(items, oldItems, 'pubDate');
          if (addedItems.length > 0 && state.activeFeedID === feedID) {
            state.activeFeedUpdated = true;
          }
          state.itemList[feedID].push(...addedItems);
        });
      })
      .catch(console.log)
      .finally(() => {
        iter(chunks.slice(1));
      });
  };
  iter(chunksOfFeeds);
};

export const addNewFeed = (feedURL) => {
  state.feedRequestState = 'loading';
  getDataFromUrl(feedURL)
    .then(({
      feedTitle, feedDesc, feedID, items,
    }) => {
      if (state.feedList.length === 0) {
        updateFeedItems();
      }
      state.feedList = [{
        feedID, feedTitle, feedDesc, feedURL,
      }, ...state.feedList];
      state.itemList = { ...state.itemList, [feedID]: items };
      state.feedRequestState = 'success';
    })
    .catch((error) => {
      console.log(error);
      state.feedRequestState = 'failure';
    })
    .finally(() => {
      state.inputState = 'idle';
    });
};

export const changeActiveFeed = (feedID) => {
  state.prevFeedID = state.activeFeedID;
  state.activeFeedID = feedID;
};

export const changeModalDesc = (itemDesc) => {
  state.modalDesc = itemDesc;
};
