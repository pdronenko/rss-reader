const parser = new DOMParser();

export const renderAlert = (alertStyle, message) => {
  const alertHTML = `
    <div role="alert" class="alert ${alertStyle} alert-dismissible fade show">
      <strong>${message}</strong>
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
  const alertEl = parser.parseFromString(alertHTML, 'text/html').body.firstChild;
  return alertEl;
};

export const renderItem = ({
  itemTitle, itemLink, itemDesc, pubDate, handleClickDescButton,
}) => {
  const itemHTML = `
    <a class="list-group-item list-group-item-action" href="${itemLink}" target="_blank" data-pubdate="${pubDate}">
      ${itemTitle}
    </a>
  `;
  const descButtonHtml = `
    <a href="#modalDesc" class="btn btn-primary float-right" data-toggle="modal">Description</a>
  `;
  const itemEl = parser.parseFromString(itemHTML, 'text/html').body.firstChild;
  const descButtonEl = parser.parseFromString(descButtonHtml, 'text/html').body.firstChild;
  descButtonEl.addEventListener('click', handleClickDescButton(itemDesc));
  itemEl.append(descButtonEl);
  return itemEl;
};

export const renderFeed = ({
  feedID, feedTitle, feedDesc, handleClickFeed,
}) => {
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
  return feedEl;
};
