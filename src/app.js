import { watch } from 'melanke-watchjs';
import $ from 'jquery';
import { renderAlert, renderItem, renderFeed } from './renderers';
import State from './State';

export default () => {
  const state = new State();
  const form = document.getElementById('rss-url-input');
  const input = document.getElementById('input-feed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const addFeedBtnText = addFeedBtn.textContent;
  const feedListContainer = document.getElementById('feed-list');
  const itemsListContainer = document.getElementById('item-list');
  const alertContainer = document.getElementById('alert-container');
  const modalContainer = document.getElementById('modal-body');

  const handleClickFeed = (e) => {
    const feedID = e.target.closest('a').hash.slice(1);
    state.changeActiveFeed(feedID);
  };

  const handleClickDescButton = itemDesc => (e) => {
    e.preventDefault();
    state.changeModalDesc(itemDesc);
  };

  const renderItems = (items) => {
    itemsListContainer.innerHTML = '';
    items.forEach((item) => {
      const itemEl = renderItem({ ...item, handleClickDescButton });
      itemsListContainer.insertBefore(itemEl, itemsListContainer.firstChild);
    });
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
        const newAlert = renderAlert('alert-success', `Feed "${newFeedTitle}" successfuly added`);
        alertContainer.insertBefore(newAlert, alertContainer.firstChild);
        input.value = '';
        break;
      }
      case 'failure': {
        const alertEl = renderAlert('alert-danger', 'This URL is wrong or not RSS, try another');
        alertContainer.insertBefore(alertEl, alertContainer.firstChild);
        break;
      }
      default:
        console.log(`${feedRequestState} - wrong value`);
    }
  });

  watch(state, 'feedList', () => {
    feedListContainer.innerHTML = '';
    state.feedList.forEach((feed) => {
      const feedEl = renderFeed({ ...feed, handleClickFeed });
      if (feed.feedID === state.activeFeedID) {
        feedEl.classList.add('active');
      }
      feedListContainer.append(feedEl);
    });
  });

  watch(state, 'itemList', () => {
    const activeFeedItems = state.itemList[state.activeFeedID];
    if (activeFeedItems && itemsListContainer.children.length !== activeFeedItems.length) {
      renderItems(activeFeedItems);
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
    renderItems(activeFeedItems);
  });

  watch(state, 'modalDesc', () => {
    modalContainer.textContent = state.modalDesc;
  });

  input.addEventListener('input', ({ target: { value } }) => {
    state.checkURL(value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.addNewFeed(input.value);
  });
};
