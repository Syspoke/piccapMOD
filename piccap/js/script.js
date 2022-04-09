/*
HTML IDs
ip			              - Textinput IP
port  		              - Textinput Port
startdelay	              - Textinput Delay to start video capture
width			          - Textinput Capture width
height		      	      - Textinput Capture height
fps		          	      - Textinput Capture FPS

radioold	       	      - Radio Old TV (libvt + libgm)
radionew	    	      - Radio New 2020+ TV (libvtcapture + libhalgal)

videocapture	          - Checkbox video capture
graphiccapture  	      - Checkbox graphic capture
autostart		          - Checkbox Autostart

servicestatus	          - Text Status Service
permissionstatus          - Text Status Permissions (libvtcapture)

OnClick-Functions
save()		              - Btn Save
loadconf()                - Btn Load configuration
stopservice()	          - Btn Stop Service
startservice()	       	  - Btn Start Service
reboot()	              - Btn Reboot
resetconf()		          - Btn Reset configuration 
*/

require('core-js/stable');
require('regenerator-runtime');
const { Promise } = require('bluebird');

function wait(t) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, t);
  });
}

function asyncCall(uri, args) {
  return new Promise((resolve, reject) => {
    const service = uri.split('/', 3).join('/');
    const method = uri.split('/').slice(3).join('/')
    webOS.service.request(service, {
      method,
      parameters: args,
      onComplete: resolve,
      onFailure: reject,
    });
  });
}

async function startup() {
  await checkRoot();
  await getSettings();
  await getStatus();
}

startup();

async function checkRoot(){
  let wasRoot = true;
  let isroot = false;

  for (let i = 0 ; i < 15 ; i++) {
    const res = await asyncCall('luna://org.webosbrew.piccap.service/isRoot', {});
    console.info(res);

    if (res.rootStatus){
      if(!wasRoot){
        document.getElementById("permissionstatus").innerHTML = 'Evaluate success! Rooted.';
        await wait(3000);
        return;
      }
      document.getElementById("permissionstatus").innerHTML = 'Running as root';
      break;
    }

    if(!isroot){
      wasRoot = false;
      document.getElementById("permissionstatus").innerHTML = 'Service elevation in progress..';
      await wait(2000);
    }
    document.getElementById("permissionstatus").innerHTML = 'Not running as root';
  }

}

async function getSettings() {
  const config = await asyncCall('luna://org.webosbrew.piccap.service/getSettings', {});
  console.info(config);

  Array.prototype.slice.call(document.querySelectorAll('input[name="radiolib"]')).forEach(el => {
    el.checked = (config.backend || 'auto') === el.value;
  });
  Array.prototype.slice.call(document.querySelectorAll('input[name="radiouilib"]')).forEach(el => {
    el.checked = (config.uibackend || 'auto') === el.value;
  });


  document.getElementById("address").value = config.address;
  document.getElementById("port").value = config.port;
  document.getElementById("priority").value = config.priority;
  document.getElementById("width").value = config.width;
  document.getElementById("height").value = config.height;
  document.getElementById("fps").value = config.fps;

  document.getElementById("videocapture").checked = config.novideo;
  document.getElementById("graphiccapture").checked = config.nogui;
  document.getElementById("autostart").checked = config.autostart;
  document.getElementById("vsync").checked = config.vsync;

  console.info('Done!');
  getStatus();
}

async function getStatus() {
  const res = await asyncCall('luna://org.webosbrew.piccap.service/isRunning', {});
  document.getElementById("servicestatus").innerHTML = res.isRunning ? 'Capture is running.' : 'Capture is stopped.';
}

window.getSettings = async () => {
  await getSettings();
}

window.reboot = async () => {
    console.log("Trying to reboot TV using HBChannel..");
    document.getElementById("servicestatus").innerHTML = "Rebooting TV..";
    const res = await asyncCall('luna://org.webosbrew.hbchannel.service/reboot', {});
}

window.resetconf = () => {
  asyncCall('luna://org.webosbrew.piccap.service/resetSettings', {}).then(getSettings);
}

window.save = async () => {
  const config = {
    address: document.getElementById("address").value || undefined,
    port: parseInt(document.getElementById("port").value) || undefined,
    priority: parseInt(document.getElementById("priority").value) || undefined,
    width: parseInt(document.getElementById("width").value) || undefined,
    height: parseInt(document.getElementById("height").value) || undefined,
    fps: parseInt(document.getElementById("fps").value) || 0,
    backend: document.querySelector('input[name=radiolib]:checked').value,
    uibackend: document.querySelector('input[name=radiouilib]:checked').value,
    novideo: document.getElementById("videocapture").checked,
    nogui: document.getElementById("graphiccapture").checked,
    autostart: document.getElementById("autostart").checked,
    vsync: document.getElementById("vsync").checked
  };
  console.info(config);

  document.getElementById("servicestatus").innerHTML = "Saving..";
  const res = await asyncCall('luna://org.webosbrew.piccap.service/setSettings', config);
  await getSettings();
  await getStatus();
}

window.startservice = async () => {
  try {
    document.getElementById("servicestatus").innerHTML = "Starting...";
    await asyncCall('luna://org.webosbrew.piccap.service/start');
    await getStatus();
  } catch (err) {
    document.getElementById("servicestatus").innerHTML = "Failed: "+ JSON.stringify(err);
  }
}

window.stopservice = async () => {
  try {
    document.getElementById("servicestatus").innerHTML = "Stopping...";
    await asyncCall('luna://org.webosbrew.piccap.service/stop');
    await getStatus();
  } catch (err) {
    document.getElementById("servicestatus").innerHTML = "Failed: "+ JSON.stringify(err);
  }
}