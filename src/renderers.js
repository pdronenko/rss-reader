const feedsListContainer = document.getElementById('feed-list');
const itemsListContainer = document.getElementById('item-list');
const alertContainer = document.getElementById('alert-container');

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

export const renderItems = (feedID, items, handleClickDescButton) => {
  itemsListContainer.innerHTML = items
    .map(({ itemTitle, itemLink, pubDate }) => `
      <a class="list-group-item list-group-item-action" href="${itemLink}" target="_blank">${itemTitle}
        <button href="#modalDesc" class="btn btn-primary float-right" data-toggle="modal" data-feed-id="${feedID}" data-pub-date="${pubDate}">
          Description
        </button>
      </a>
    `)
    .reverse()
    .join('');
  document.querySelectorAll('[data-toggle="modal"]').forEach((descButton) => {
    descButton.addEventListener('click', handleClickDescButton);
  });
};

export const renderFeeds = (feedList, activeFeedID, handleClickFeed) => {
  feedsListContainer.innerHTML = feedList
    .map(({ feedID, feedTitle, feedDesc }) => `
      <a id="feed-${feedID}" class="list-group-item list-group-item-action flex-column align-items-start" href="#${feedID}" data-type="feed">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${feedTitle}</h5>
        </div>
        <p class="mb-1">${feedDesc}</p>
      </a>
    `)
    .join('');
  document.querySelectorAll('[data-type="feed"]').forEach((feed) => {
    feed.addEventListener('click', handleClickFeed);
  });
  if (activeFeedID) {
    document.querySelector(`#feed-${activeFeedID}`).classList.add('active');
  }
};
