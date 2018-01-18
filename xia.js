const Plugin = require('./lib/plugin.js');
const Xiaomi = require('./lib/xiaomi');
const { getDeviceValue, getDeviceAction } = require('./lib/utils');

const plugin = new Plugin();

let channelsList = [];


plugin.on('params', params => {
  start(params);
});

plugin.on('channels', channels => {
  // console.log(channels);
});

function getChanel(sid, desc) {
  return { id: `${desc}_${sid}`, desc };
}

function getChanelList(device) {
  return Object.keys(device.props)
      .filter(key => device.props[key] && device.props[key].type !== 'ext')
      .map(key => getChanel(device.sid, device.props[key].alias));
}

function getChanelData(sid, props, data) {
  const ext =  Object.keys(data)
    .filter(key => props[key] && props[key].type === 'ext')
    .reduce((l, n) => Object.assign({}, l, { [props[n].alias]: getDeviceValue(data[n]) }), {})

  return Object.keys(data)
    .filter(key => props[key] && props[key].type !== 'ext')
    .map(key => ({ id: `${props[key].alias}_${sid}`, value: getDeviceValue(data[key]), ext  }));
}

function start(options) {
  const xiaomi = new Xiaomi(options);

  xiaomi.on('device', device => {
    plugin.setChannels(getChanelList(device));
    plugin.setChannelsData(getChanelData(device.sid, device.props, device.data));
  });

  xiaomi.on('data', device => {
    plugin.setChannelsData(getChanelData(device.sid, device.props, device.data));
  });

  plugin.on('actions', data => {
    data.forEach(item => {
      const [alias, id] = item.id.split('_');
      const value = item.value;
      const command = item.command;
      const action = getDeviceAction(id, alias, [value]);

      xiaomi.sendAction(action);
    });
  });
}
