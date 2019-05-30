import { watch } from 'melanke-watchjs';
import axios from 'axios';
import { handleInput, inputState } from './handleInput';

const addFeedState = {
  status: 'idle',
};

const feedList = [];

const currentFeed = '';

export default () => {
  const form = document.getElementById('rss-url-input');
  const input = document.getElementById('inputFeed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const inputClasses = input.classList;
  const feedListEl = document.getElementById('feed-list');
  const rssListEl = document.getElementById('rss-list');

  watch(inputState, 'status', (prop, action, newvalue) => {
    switch (newvalue) {
      case 'empty':
        input.value = '';
        inputClasses.remove('border-danger', 'border-success');
        addFeedBtn.removeAttribute('disabled');
        break;
      case 'isNewURL':
        inputClasses.remove('border-danger');
        inputClasses.add('border-success');
        addFeedBtn.removeAttribute('disabled');
        break;
      case 'isDouble':
        inputClasses.remove('border-success');
        inputClasses.add('border-danger');
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      case 'notURL':
        inputClasses.remove('border-success');
        inputClasses.add('border-danger');
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      default:
        console.log('error');
    }
  });
  
  watch(addFeedState, 'status', (prop, action, newvalue) => {
    switch (newvalue) {
      case 'idle':
        addFeedBtn.innerHTML = 'Add feed';
        addFeedBtn.removeAttribute('disabled');
        break;
      case 'loading':
        addFeedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      default:
        console.log('error');
    }
  });
  
  watch(feedList, () => {
    feedListEl.innerHTML = feedList.map(({ url, title, description }) => {
      const newFeed = `
        <a href="#" class="list-group-item list-group-item-action" url="${url}">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${title}</h5>
          </div>
          <p class="mb-1">${description}</p>
        </a>
      `
      return newFeed;
    }).join('');
  })
  
  const handleClickFeed = (e) => {
    e.preventDefault();
    const currentUrl = e.target.closest('a');
    const prevUrl = e.target.closest('div').querySelector('.active');
    if (prevUrl) {
      prevUrl.classList.remove('active');
    }
    currentUrl.classList.add('active');
    const feedID = currentUrl.getAttribute('url');
    const { items } = feedList.find(({ url }) => feedID === url);
    rssListEl.innerHTML = items.map(({ title, link }) => {
      const newItem = `<a href="${link}" class="list-group-item list-group-item-action">${title}</a>`;
      return newItem;
    }).join('');
  };
  
  const handleSubmit = (e) => {
    const domparser = new DOMParser();
    addFeedState.status = 'loading';
    const url = inputState.text;
    e.preventDefault();
    axios.get(`https://cors-anywhere.herokuapp.com/${url}`)
      .then((response) => {
        const channelFeed = domparser.parseFromString(response.data, 'application/xml');
        addFeedState.status = 'idle';
        inputState.status = 'empty';

        const title = channelFeed.querySelector('title').textContent;
        const description = channelFeed.querySelector('description').textContent;
        const rssItems = [...channelFeed.querySelectorAll('item')];
        const filteredRssItems = rssItems.map(item => ({
          title: item.querySelector('title').textContent,
          link: item.querySelector('link').textContent,
        }))
        feedList.push({ url, title, description, items: filteredRssItems });
      })
      .catch((error) => {
        addFeedState.status = 'idle';
        inputState.status = 'notURL';
      })
  };

  form.addEventListener('change', handleInput);
  form.addEventListener('submit', handleSubmit);
  feedListEl.addEventListener('click', handleClickFeed);
};
