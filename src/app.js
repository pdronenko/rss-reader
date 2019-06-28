import { watch } from 'melanke-watchjs';
import $ from 'jquery';
import { uniqueId, unionBy } from 'lodash';
import { isURL } from 'validator';
import axios from 'axios';
import pLimit from 'p-limit';
import getState from './states';
import parseRSS from './rssParser';
import { renderAlert, renderItems, renderFeeds } from './renderers';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const getDataFromUrl = (url, feedID = uniqueId()) => axios
  .get(`${corsProxy}${url}`)
  .then(({ data }) => parseRSS(data, feedID));

export default () => {
  const state = getState();
  const form = document.getElementById('rss-form');
  const input = document.getElementById('input-feed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const addFeedBtnText = addFeedBtn.textContent;
  const modalContainer = document.getElementById('modal-body');

  const updateInputState = (value) => {
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

  const updateFeedItems = (feedDataArray) => {
    feedDataArray.forEach(({ items, feedID }) => {
      const oldItems = state.itemList[feedID];
      const updatedItems = unionBy(oldItems, items, 'pubDate');
      state.itemList[feedID] = updatedItems;
      state.activeFeedUpdated = oldItems.length !== updatedItems.length;
    });
  };

  const getFeedsUpdate = () => {
    state.activeFeedUpdated = false;
    const requestLimit = pLimit(10);
    const requestPromises = state.feedList
      .map(({ feedURL, feedID }) => requestLimit(() => getDataFromUrl(feedURL, feedID)));

    Promise.all(requestPromises)
      .then(updateFeedItems)
      .finally(() => {
        setTimeout(getFeedsUpdate, 5000);
      });
  };

  const addNewFeed = (feedURL) => {
    state.feedRequestState = 'loading';
    getDataFromUrl(feedURL)
      .then(({
        feedTitle, feedDesc, feedID, items,
      }) => {
        if (state.feedList.length === 0) {
          getFeedsUpdate();
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

  const changeActiveFeed = (feedID) => {
    state.prevFeedID = state.activeFeedID;
    state.activeFeedID = feedID;
  };

  const handleClickFeed = (e) => {
    const feedID = e.target.closest('a').hash.slice(1);
    changeActiveFeed(feedID);
  };

  const handleClickDescButton = itemDesc => (e) => {
    e.preventDefault();
    state.modalDesc = itemDesc;
  };

  watch(state, 'inputState', () => {
    const inputClasses = input.classList;
    inputClasses.remove('border-danger', 'border-warning', 'border-success');
    input.removeAttribute('readonly');
    addFeedBtn.setAttribute('disabled', 'disabled');
    addFeedBtn.dataset.originalTitle = '';
    $('#btn-add-feed').tooltip('hide');
    addFeedBtn.innerHTML = addFeedBtnText;
    switch (state.inputState) {
      case 'idle': {
        break;
      }
      case 'notURL': {
        inputClasses.add('border-danger');
        break;
      }
      case 'isDouble': {
        inputClasses.add('border-warning');
        addFeedBtn.dataset.originalTitle = 'This URL is already added';
        $('#btn-add-feed').tooltip('show');
        break;
      }
      case 'isURL': {
        inputClasses.add('border-success');
        addFeedBtn.removeAttribute('disabled');
        break;
      }
      default:
        console.log(`${state.inputState} - wrong value`);
    }
  });

  watch(state, 'feedRequestState', () => {
    const { feedRequestState } = state;
    switch (feedRequestState) {
      case 'loading': {
        input.setAttribute('readonly', 'readonly');
        addFeedBtn.setAttribute('disabled', 'disabled');
        addFeedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        break;
      }
      case 'success': {
        const newFeedTitle = state.feedList[0].feedTitle;
        renderAlert('alert-success', `Feed "${newFeedTitle}" successfuly added`);
        input.value = '';
        break;
      }
      case 'failure': {
        renderAlert('alert-danger', 'This URL is wrong or not RSS, try another');
        break;
      }
      default:
        console.log(`${feedRequestState} - wrong value`);
    }
  });

  watch(state, 'feedList', () => {
    renderFeeds(state.feedList, state.activeFeedID, handleClickFeed);
  });

  watch(state, 'activeFeedUpdated', () => {
    if (state.activeFeedUpdated) {
      const activeFeedItems = state.itemList[state.activeFeedID];
      renderItems(activeFeedItems, handleClickDescButton);
    }
  });

  watch(state, 'activeFeedID', () => {
    const { activeFeedID, prevFeedID } = state;
    const activeFeedEl = document.getElementById(`feed-${activeFeedID}`);
    const prevFeedEl = document.getElementById(`feed-${prevFeedID}`);
    activeFeedEl.classList.add('active');
    if (prevFeedEl) {
      prevFeedEl.classList.remove('active');
    }
    const activeFeedItems = state.itemList[state.activeFeedID];
    renderItems(activeFeedItems, handleClickDescButton);
  });

  watch(state, 'modalDesc', () => {
    modalContainer.textContent = state.modalDesc;
  });

  input.addEventListener('input', ({ target: { value } }) => {
    updateInputState(value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addNewFeed(formData.get('input-feed'));
  });
};
