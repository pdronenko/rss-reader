import { watch } from 'melanke-watchjs';
import { uniqueId, unionBy, values } from 'lodash';
import { isURL } from 'validator';
import axios from 'axios';
import pLimit from 'p-limit';
import getState from './states';
import parseRSS from './rssParser';
import { renderAlert, renderItems, renderChannels } from './renderers';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const getDataFromUrl = url => axios
  .get(`${corsProxy}${url}`)
  .then(({ data }) => parseRSS(data));

export default () => {
  const { channelsData, states } = getState();
  const form = document.getElementById('rss-form');
  const input = document.getElementById('input-url');
  const channelsContainer = document.getElementById('channel-list');
  const addChannelBtn = document.getElementById('btn-add-channel');
  const invalidFeedback = document.querySelector('.invalid-feedback');
  const addChannelBtnText = addChannelBtn.textContent;
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
        check: inputURL => values(channelsData.channels)
          .some(({ url }) => url === inputURL),
      },
      {
        inputStateName: 'isURL',
        check: isURL,
      },
    ];
    const { inputStateName } = urlCheckersList.find(({ check }) => check(value));
    states.inputState = inputStateName;
  };

  const updateChannelItems = (channelDataArray) => {
    channelDataArray.forEach(({ items, id }) => {
      const oldItems = channelsData.items[id];
      const updatedItems = unionBy(items, oldItems, 'guid');
      channelsData.items[id] = updatedItems;
      states.activeChannelUpdated = states.activeChannelID === id
        && oldItems.length !== updatedItems.length;
    });
  };

  const startUpdateChannels = () => {
    states.activeChannelUpdated = false;
    const requestLimit = pLimit(10);
    const { channelsOrder, channels } = channelsData;
    const requestPromises = channelsOrder
      .map(id => requestLimit(() => getDataFromUrl(channels[id].url)
        .then(({ items }) => ({ items, id }))));

    Promise.all(requestPromises)
      .then(updateChannelItems)
      .finally(() => {
        setTimeout(startUpdateChannels, 5000);
      });
  };

  const addNewChannel = (url) => {
    states.channelRequestState = 'loading';
    getDataFromUrl(url)
      .then(({ channel, items }) => {
        if (channelsData.channelsOrder.length === 0) {
          startUpdateChannels();
        }
        const id = uniqueId();
        channelsData.channels[id] = { ...channel, url };
        channelsData.items[id] = items;
        channelsData.channelsOrder = [id, ...channelsData.channelsOrder];
        states.channelRequestState = 'success';
      })
      .catch((error) => {
        console.log(error);
        states.channelRequestState = 'failure';
      })
      .finally(() => {
        states.inputState = 'idle';
      });
  };

  const changeActiveChannel = (channelID) => {
    states.prevChannelID = states.activeChannelID;
    states.activeChannelID = channelID;
  };

  const handleClickChannel = (e) => {
    e.preventDefault();
    const { channelId } = e.target.closest('a').dataset;
    changeActiveChannel(channelId);
  };

  const handleClickDescButton = (e) => {
    e.preventDefault();
    const { guid } = e.target.closest('a').dataset;
    const { activeChannelID } = states;
    const activeItemsData = values(channelsData.items[activeChannelID]);
    const { description } = activeItemsData.find(item => item.guid === guid);
    states.modalDesc = description;
  };

  watch(states, 'inputState', () => {
    const inputClasses = input.classList;
    inputClasses.remove('is-invalid', 'is-valid');
    input.removeAttribute('readonly');
    addChannelBtn.setAttribute('disabled', 'disabled');
    addChannelBtn.innerHTML = addChannelBtnText;
    switch (states.inputState) {
      case 'idle': {
        break;
      }
      case 'notURL': {
        invalidFeedback.textContent = 'Wrong URL!';
        inputClasses.add('is-invalid');
        break;
      }
      case 'isDouble': {
        invalidFeedback.textContent = 'This URL is already added';
        inputClasses.add('is-invalid');
        break;
      }
      case 'isURL': {
        inputClasses.add('is-valid');
        addChannelBtn.removeAttribute('disabled');
        break;
      }
      default:
        console.log(`${states.inputState} - wrong value`);
    }
  });

  watch(states, 'channelRequestState', () => {
    switch (states.channelRequestState) {
      case 'loading': {
        input.setAttribute('readonly', 'readonly');
        addChannelBtn.setAttribute('disabled', 'disabled');
        addChannelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        break;
      }
      case 'success': {
        const newChannelID = channelsData.channelsOrder[0];
        const { title } = channelsData.channels[newChannelID];
        renderAlert('alert-success', `Feed "${title}" successfuly added`);
        input.value = '';
        break;
      }
      case 'failure': {
        renderAlert('alert-danger', 'This URL is wrong or not RSS, try another');
        break;
      }
      default:
        console.log(`${states.channelRequestState} - wrong value`);
    }
  });

  watch(channelsData, 'channelsOrder', () => {
    renderChannels(channelsData, states.activeChannelID);
  });

  watch(states, 'activeChannelUpdated', () => {
    if (states.activeChannelUpdated) {
      const { activeChannelID } = states;
      const activeChannelItems = channelsData.items[activeChannelID];
      renderItems(activeChannelItems, handleClickDescButton);
    }
  });

  watch(states, 'activeChannelID', () => {
    renderChannels(channelsData, states.activeChannelID);
    const activeChannelItems = channelsData.items[states.activeChannelID];
    renderItems(activeChannelItems, handleClickDescButton);
  });

  watch(states, 'modalDesc', () => {
    modalContainer.textContent = states.modalDesc;
  });

  input.addEventListener('input', ({ target: { value } }) => {
    updateInputState(value);
  });

  channelsContainer.addEventListener('click', handleClickChannel);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addNewChannel(formData.get('input-url'));
  });
};
