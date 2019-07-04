export default () => {
  const channelsData = {
    channelsOrder: [],
    channels: {},
    items: {},
  };

  const states = {
    inputState: 'idle', // idle, notURL, isDouble, isURL
    channelRequestState: 'idle', // loading, success, failure
    activeChannelID: null,
    prevChannelID: null,
    activeChannelUpdated: false,
  };

  return { channelsData, states };
};
