const channelsContainer = document.getElementById('channel-list');
const itemsContainer = document.getElementById('item-list');
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

export const renderItems = (items, handleClickDescButton) => {
  itemsContainer.innerHTML = items
    .map(item => `
      <a class="list-group-item list-group-item-action" href="${item.link}" target="_blank" data-guid="${item.guid}">
        ${item.title}
        <button href="#modalDesc" class="btn btn-primary float-right" data-toggle="modal">Description</button>
      </a>
    `)
    .join('');
  const descButtons = itemsContainer.querySelectorAll('[data-toggle="modal"]');
  descButtons.forEach(button => button.addEventListener('click', handleClickDescButton));
};

export const renderChannels = (channelsData, activeChannelID) => {
  const { channelsOrder, channels } = channelsData;
  channelsContainer.innerHTML = channelsOrder
    .map((id) => {
      const { title, link, description } = channels[id];
      const activeClass = id === activeChannelID ? ' active' : '';
      return `
        <a class="list-group-item list-group-item-action flex-column align-items-start${activeClass}" data-channel-id="${id}" href="${link}">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${title}</h5>
          </div>
          <p class="mb-1">${description}</p>
        </a>
      `;
    })
    .join('');
};
