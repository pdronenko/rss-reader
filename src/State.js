import { isURL } from 'validator';
import axios from 'axios';
import {
  differenceBy, uniqueId, chunk, flatten,
} from 'lodash';
import parseRSS from './RssParser';

const getDataFromUrl = (url) => {
  const corsProxy = 'https://cors-anywhere.herokuapp.com/';
  return axios.get(`${corsProxy}${url}`).then(({ data }) => parseRSS(data));
};

export default class State {
  constructor() {
    this.inputState = 'idle';
    this.feedRequestState = 'idle';
    this.feedList = [];
    this.itemList = {};
    this.activeFeedID = '';
    this.prevFeedID = '';
  }

  checkURL(value) {
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
        check: inputURL => this.feedList.some(({ feedURL }) => inputURL === feedURL),
      },
      {
        inputStateName: 'isURL',
        check: isURL,
      },
    ];
    const { inputStateName } = urlCheckersList.find(({ check }) => check(value));
    this.inputState = inputStateName;
  }

  updateFeedItems() {
    const batchRequestsNum = 10;
    const batchFeeds = chunk(this.feedList, batchRequestsNum);
    const promises = batchFeeds.map(feeds => feeds
      .map(({ feedURL, feedID }) => {
        const oldItems = this.itemList[feedID];
        return getDataFromUrl(feedURL)
          .then((parsedData) => {
            const newItems = parsedData.items;
            const addedItems = differenceBy(newItems, oldItems, 'pubDate');
            this.itemList[feedID].push(...addedItems);
          })
          .catch(console.log);
      }));
    Promise.all(flatten(promises))
      .finally(() => setTimeout(() => {
        this.updateFeedItems();
      }, 5000));
  }

  addNewFeed(feedURL) {
    this.feedRequestState = 'loading';
    getDataFromUrl(feedURL)
      .then(({ feedTitle, feedDesc, items }) => {
        if (this.feedList.length === 0) {
          this.updateFeedItems();
        }
        const feedID = uniqueId();
        this.feedList = [{
          feedID, feedTitle, feedDesc, feedURL,
        }, ...this.feedList];
        this.itemList = { ...this.itemList, [feedID]: items };
        this.feedRequestState = 'success';
      })
      .catch((error) => {
        console.log(error);
        this.feedRequestState = 'failure';
      })
      .finally(() => {
        this.inputState = 'idle';
      });
  }

  changeActiveFeed(feedID) {
    this.prevFeedID = this.activeFeedID;
    this.activeFeedID = feedID;
  }

  changeModalDesc(itemDesc) {
    this.modalDesc = itemDesc;
  }
}
