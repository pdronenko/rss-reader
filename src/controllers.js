import {
  differenceBy, uniqueId, chunk, flatten,
} from 'lodash';
import { isURL } from 'validator';
import axios from 'axios';
import getState from './state';
import parseRSS from './rssParser';


export const state = getState();
const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const getDataFromUrl = url => axios.get(`${corsProxy}${url}`).then(({ data }) => parseRSS(data));

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
  const batchRequestsNum = 10;
  const batchFeeds = chunk(state.feedList, batchRequestsNum);
  const promises = batchFeeds.map(feeds => feeds
    .map(({ feedURL, feedID }) => {
      const oldItems = state.itemList[feedID];
      return getDataFromUrl(feedURL)
        .then((parsedData) => {
          const newItems = parsedData.items;
          const addedItems = differenceBy(newItems, oldItems, 'pubDate');
          if (addedItems.length > 0 && state.activeFeedID === feedID) {
            state.activeFeedUpdated = true;
          }
          state.itemList[feedID].push(...addedItems);
        })
        .catch(console.log);
    }));
  Promise.all(flatten(promises))
    .finally(() => setTimeout(() => {
      updateFeedItems();
    }, 5000));
};

export const addNewFeed = (feedURL) => {
  state.feedRequestState = 'loading';
  getDataFromUrl(feedURL)
    .then(({ feedTitle, feedDesc, items }) => {
      if (state.feedList.length === 0) {
        updateFeedItems();
      }
      const feedID = uniqueId();
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
