const feedsListContainer = document.getElementById('feed-list');
const itemsListContainer = document.getElementById('item-list');
const alertContainer = document.getElementById('alert-container');

const parser = new DOMParser();

export const renderAlert = (alertStyle, message) => {
  alertContainer.innerHTML = `
    <div role="alert" class="alert ${alertStyle} alert-dismissible fade show">
      <strong>${message}</strong>
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
};

export const renderItems = (items, handleClickDescButton) => {
  itemsListContainer.innerHTML = '';
  items.forEach(({
    itemTitle, itemLink, itemDesc, pubDate,
  }) => {
    const itemHTML = `
      <a class="list-group-item list-group-item-action" href="${itemLink}" target="_blank" data-pubdate="${pubDate}">
        ${itemTitle}
      </a>
    `;
    const descButtonHtml = `
      <button href="#modalDesc" class="btn btn-primary float-right" data-toggle="modal">Description</button>
    `;
    const itemEl = parser.parseFromString(itemHTML, 'text/html').body.firstChild;
    const descButtonEl = parser.parseFromString(descButtonHtml, 'text/html').body.firstChild;
    descButtonEl.addEventListener('click', handleClickDescButton(itemDesc));
    itemEl.append(descButtonEl);

    itemsListContainer.insertBefore(itemEl, itemsListContainer.firstChild);
  });
};

export const renderFeeds = (feedList, activeFeedID, handleClickFeed) => {
  feedsListContainer.innerHTML = '';
  feedList.forEach(({ feedID, feedTitle, feedDesc }) => {
    const feedHTML = `
      <a id="feed-${feedID}" class="list-group-item list-group-item-action flex-column align-items-start" href="#${feedID}">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${feedTitle}</h5>
        </div>
        <p class="mb-1">${feedDesc}</p>
      </a>
    `;
    const feedEl = parser.parseFromString(feedHTML, 'text/html').body.firstChild;
    feedEl.addEventListener('click', handleClickFeed);
    if (feedID === activeFeedID) {
      feedEl.classList.add('active');
    }
    feedsListContainer.append(feedEl);
  });
};
