import StateMachine from 'javascript-state-machine';
import { differenceBy } from 'lodash';
import axios from 'axios';
import { watch } from 'melanke-watchjs';
import { isURL } from 'validator';
import states from './states';

export default () => {
  const corsProxy = 'https://cors-anywhere.herokuapp.com/';
  const form = document.getElementById('rss-url-input');
  const input = document.getElementById('inputFeed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const feedListDiv = document.getElementById('feed-list');
  const itemListDiv = document.getElementById('item-list');
  const alertContainer = document.getElementById('alert-container');

  const {
    formState, alertState, feedListState, modalInfo,
  } = states();

  const urlAlreadyAdded = newURL => !!feedListState.feedList.find(({ url }) => newURL === url);

  const isDomParserError = parsedData => parsedData.getElementsByTagName('parsererror').length > 0;

  const getDataFromURL = url => axios.get(`${corsProxy}${url}`)
    .then(({ data }) => {
      const domparser = new DOMParser();
      const parsedData = domparser.parseFromString(data, 'application/xml');
      if (isDomParserError(parsedData)) {
        throw new Error('error parsing data');
      }
      return parsedData;
    });

  const handleClickFeed = url => (e) => {
    e.preventDefault();
    feedListState.prevFeedURL = feedListState.currentFeedURL;
    feedListState.currentFeedURL = url;
  };

  const handleDescButton = desc => () => {
    modalInfo.desc = desc;
  };

  const makeNewItemElement = (title, link, desc, pubDate) => {
    const newitemEl = document.createElement('a');
    newitemEl.classList.add('list-group-item', 'list-group-item-action');
    newitemEl.setAttribute('href', link);
    newitemEl.setAttribute('target', '_blank');
    newitemEl.setAttribute('pubDate', pubDate);
    newitemEl.innerHTML = `
      ${title}
      <a href="#modalDesc" class="btn btn-primary float-right" data-toggle="modal">Description</a>
    `;
    const descButton = newitemEl.querySelector('a');
    descButton.addEventListener('click', handleDescButton(desc));
    return newitemEl;
  };

  const makeNewAlert = (alertStyle, message) => {
    const newAlert = document.createElement('div');
    newAlert.setAttribute('role', 'alert');
    newAlert.classList.add('alert', alertStyle, 'alert-dismissible', 'fade', 'show');
    newAlert.innerHTML = `
      <strong>${message}</strong>
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    return newAlert;
  };

  const renderFeedItems = (items) => {
    itemListDiv.innerHTML = '';
    feedListState.activeFeedItemsCount = items.length;
    items.forEach(({
      title, link, desc, pubDate,
    }) => {
      const newitemEl = makeNewItemElement(title, link, desc, pubDate);
      itemListDiv.append(newitemEl);
    });
  };

  const getItemsArray = (parsedData) => {
    const itemsNodeList = parsedData.querySelectorAll('item');
    const items = [];
    itemsNodeList.forEach((item) => {
      const title = item.querySelector('title').textContent;
      const desc = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      const pubDate = item.querySelector('pubDate').textContent;
      items.push({
        title, link, desc, pubDate,
      });
    });
    return items;
  };

  const feedFsm = new StateMachine({
    init: 'timeout',
    transitions: [
      { name: 'getNewData', from: 'timeout', to: 'loadingData' },
      { name: 'timeoutBetweenRequests', from: 'loadingData', to: 'timeout' },
    ],
    methods: {
      onGetNewData: function f() {
        const feedURLs = feedListState.feedList.map(feed => feed.url);
        const promises = [];
        feedURLs.forEach((feedURL) => {
          const feedDataPromise = getDataFromURL(feedURL);
          promises.push(feedDataPromise
            .then((parsedData) => {
              const itemsFromData = getItemsArray(parsedData);
              const indexOfCurrentFeed = feedListState.feedList
                .findIndex(({ url }) => url === feedURL);
              const currentItems = feedListState.feedList[indexOfCurrentFeed].items;
              const newItems = differenceBy(itemsFromData, currentItems, 'pubDate');
              newItems.forEach((item) => {
                feedListState.feedList[indexOfCurrentFeed].items.unshift(item);
              });
            }));
        });
        Promise.all(promises).then(() => {
          feedFsm.timeoutBetweenRequests();
        });
      },
      onTimeoutBetweenRequests: function f() {
        setTimeout(() => {
          feedFsm.getNewData();
        }, 5000);
      },
    },
  });

  const formFsm = new StateMachine({
    init: 'buttonDisabled',
    transitions: [
      { name: 'validateURL', from: ['buttonDisabled', 'buttonEnabled'], to: 'buttonEnabled' },
      { name: 'pushButton', from: 'buttonEnabled', to: 'loadingData' },
      { name: 'handleLoadingError', from: 'loadingData', to: 'buttonDisabled' },
      { name: 'addNewFeed', from: 'loadingData', to: 'buttonDisabled' },
    ],
    methods: {
      onBeforeValidateURL: function f(lifecycle, e) {
        const newURL = e.target.value;
        formState.inputText = newURL;
        if (newURL === '') {
          formState.buttonState = 'off';
          formState.inputState = 'idle';
          return false;
        } if (urlAlreadyAdded(newURL)) {
          formState.buttonState = 'off';
          formState.inputState = 'isDouble';
          alertState.type = 'isDouble';
          alertState.alertCount += 1;
          return false;
        } if (isURL(newURL)) {
          formState.buttonState = 'on';
          formState.inputState = 'isURL';
          return true;
        }
        formState.buttonState = 'off';
        formState.inputState = 'notURL';
        return false;
      },
      onPushButton: function f(lifecycle, e) {
        e.preventDefault();
        formState.buttonState = 'loading';
        const feedDataPromise = getDataFromURL(formState.inputText);
        feedDataPromise
          .then((parsedData) => {
            formFsm.addNewFeed(parsedData, input.value);
            if (feedListState.addedFeedsCount < 1) {
              feedFsm.getNewData();
            }
          })
          .catch((error) => {
            console.log(error);
            formFsm.handleLoadingError();
          });
      },
      onHandleLoadingError: function f() {
        formState.inputText = '';
        formState.buttonState = 'off';
        formState.inputState = 'idle';
        alertState.type = 'wrongURL';
        alertState.alertCount += 1;
      },
      onAddNewFeed: function f(lifecycle, parsedData, url) {
        formState.inputText = '';
        formState.buttonState = 'off';
        formState.inputState = 'idle';
        alertState.type = 'feedAdded';
        alertState.alertCount += 1;
        const title = parsedData.querySelector('channel title').textContent;
        const desc = parsedData.querySelector('channel description').textContent;
        const items = getItemsArray(parsedData);
        feedListState.feedList.push({
          url, title, desc, items,
        });
      },
    },
  });

  watch(modalInfo, 'desc', () => {
    const modalDesc = document.querySelector('#modalBody');
    modalDesc.textContent = modalInfo.desc;
  });

  watch(feedListState, 'currentFeedURL', () => {
    const { currentFeedURL, prevFeedURL, feedList } = feedListState;
    const changeActiveFeed = () => {
      if (prevFeedURL !== '') {
        const prevFeed = document.querySelector(`[href="${prevFeedURL}"]`);
        prevFeed.classList.remove('active');
      }
      const activeFeed = document.querySelector(`[href="${currentFeedURL}"]`);
      activeFeed.classList.add('active');
    };
    changeActiveFeed();
    const { items } = feedList.find(({ url }) => url === currentFeedURL);
    renderFeedItems(items);
  });

  watch(feedListState, 'feedList', () => {
    const {
      feedList, currentFeedURL, addedFeedsCount, activeFeedItemsCount,
    } = feedListState;
    if (feedList.length === addedFeedsCount) {
      if (currentFeedURL === '') {
        return;
      }
      const activeFeed = feedList.find(({ url }) => url === currentFeedURL);
      if (activeFeed.items.length === activeFeedItemsCount) {
        return;
      }
      renderFeedItems(activeFeed.items);
      return;
    }
    const { url, title, desc } = feedList[feedList.length - 1];
    const newFeed = document.createElement('a');
    newFeed.classList.add('list-group-item', 'list-group-item-action', 'flex-column', 'align-items-start');
    newFeed.setAttribute('href', url);
    newFeed.innerHTML = `
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">${title}</h5>
      </div>
      <p class="mb-1">${desc}</p>
    `;
    newFeed.addEventListener('click', handleClickFeed(url));
    feedListDiv.insertBefore(newFeed, feedListDiv.firstChild);
    feedListState.addedFeedsCount += 1;
  });

  watch(formState, 'buttonState', (prop, action, newValue) => {
    switch (newValue) {
      case 'on':
        addFeedBtn.innerHTML = 'Add feed';
        addFeedBtn.removeAttribute('disabled');
        break;
      case 'off':
        addFeedBtn.innerHTML = 'Add feed';
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      case 'loading':
        addFeedBtn.setAttribute('disabled', 'disabled');
        addFeedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        break;
      default:
        console.log(`${newValue} - wrong value`);
    }
  });

  watch(formState, 'inputState', (prop, action, newValue) => {
    const inputClasses = input.classList;
    inputClasses.remove('border-danger', 'border-warning', 'border-success');
    switch (newValue) {
      case 'idle':
        input.value = '';
        break;
      case 'notURL':
        inputClasses.add('border-danger');
        break;
      case 'isDouble':
        inputClasses.add('border-warning');
        break;
      case 'isURL':
        inputClasses.add('border-success');
        break;
      default:
        console.log(`${newValue} - wrong value`);
    }
  });

  watch(alertState, 'alertCount', () => {
    const alertTypesInfo = {
      isDouble: {
        message: 'This URL is already added',
        style: 'alert-warning',
      },
      wrongURL: {
        message: 'This URL is wrong or not RSS, try another',
        style: 'alert-danger',
      },
      feedAdded: {
        message: 'Feed successfuly added',
        style: 'alert-success',
      },
    };
    const { type } = alertState;
    const newAlert = makeNewAlert(alertTypesInfo[type].style, alertTypesInfo[type].message);
    alertContainer.insertBefore(newAlert, alertContainer.firstChild);
  });

  input.addEventListener('change', (e) => {
    formFsm.validateURL(e);
  });
  form.addEventListener('submit', (e) => {
    formFsm.pushButton(e);
  });
};
