import { watch } from 'melanke-watchjs';
import $ from 'jquery';
import { renderAlert, renderItems, renderFeeds } from './renderers';
import * as controllers from './controllers';

export default () => {
  const { state } = controllers;
  const form = document.getElementById('rss-form');
  const input = document.getElementById('input-feed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const addFeedBtnText = addFeedBtn.textContent;
  const modalContainer = document.getElementById('modal-body');

  const handleClickFeed = (e) => {
    const feedID = e.target.closest('a').hash.slice(1);
    controllers.changeActiveFeed(feedID);
  };

  const handleClickDescButton = itemDesc => (e) => {
    e.preventDefault();
    controllers.changeModalDesc(itemDesc);
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
    controllers.updateInputState(value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    controllers.addNewFeed(formData.get('input-feed'));
  });
};
