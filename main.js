const {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  session,
} = require('electron');
const electron = require("electron");
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require("path");
const log = require('electron-log');
const schedule = require('node-schedule');
const si = require("systeminformation");
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

let aboutWindow, configWindow, mainWindow;
let intervalIdForSendPhotoWorkTable;
let intervalIdForSendStatus;
let ruleStart, ruleEnd;
let bot, userDataPath, logPath;

const gotTheLock = app.requestSingleInstanceLock();
const allowedDomains = {
  'default-src': `self' 'unsafe-inline'`,
  'connect-src': `https://player.iterra.world/ https://player.iterra.space/ https://video.dsi.ru  https://video1.dsi.ru:8091/ https://video2.dsi.ru:8091/ https://api.iterra.world/ https://dev.api.iterra.world/ https://widget.iterra.world/ https://dev.widget.iterra.world/ https://iterra.world/`,
  'img-src': `'self' https://iterra.world/ https://dev.iterra.world/ data:`,
  'style-src': `'self' 'unsafe-inline' https://fonts.googleapis.com`,
  'font-src': `'self' https://fonts.gstatic.com`,
};

// develop || prod
const mode = 'prod';
const methods = {
  player: {
    develop: 'https://player.iterra.space',
    prod: 'https://player.iterra.world',
  },
};

const statuses = {
  'updated': '💿',
  'sleeping': '💤',
  'awake': '✅',
  'running': '🚀',
  'connected': '⚠️',
  'working': '✅',
}

const Store = require(`${__dirname}/core/store.ts`)
const storeData = new Store({
  configName: 'user-preferences',
  defaults: {
    config: {},
    player: {},
  },
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (!mainWindow) createWindow();
})

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    const playerConfig = storeData.get('config') || {};
    const player = storeData.get('player') || {};
    generateToken();

    if (playerConfig.playerSettings && playerConfig.playerSettings.telegramBotToken) {
      bot = new TelegramBot(playerConfig.playerSettings.telegramBotToken);
      userDataPath = (electron.app || electron.remote.app).getPath('userData');
      logPath = path.join(userDataPath, 'logs/main.log');
    }

    if (!player.id) {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: Object.assign({
            "Content-Security-Policy": [
              `connect-src ${allowedDomains['connect-src']};
               default-src: ${allowedDomains['default-src']}
               img-src: ${allowedDomains['img-src']}                
               style-src: ${allowedDomains['style-src']}                
               font-src: ${allowedDomains['font-src']}                
              `,
            ]
          }, details.responseHeaders)
        });
      });

      launchApp();
    } else {
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: Object.assign({
            "Content-Security-Policy": ["https://player.iterra.space", 'https://player.iterra.world'],
          }, details.responseHeaders)
        });
      });

      processPlayerData(player.id).then(() => launchApp());
    }

    globalShortcut.register('Escape', function () {
      app.quit();
      clearInterval(intervalIdForSendPhotoWorkTable);
    });
  })
}

ipcMain.on('get-token', (event, args) => {
  const token = storeData.get('token');

  if (token) {
    configWindow.webContents.send('device-token', token);
    mainWindow.webContents.send('device-token', token);
  }
});

ipcMain.on('get-player-data', (event, args) => {
  configWindow.webContents.send('player-data', storeData.get('player'));
});

ipcMain.on('set-player-data', (event, args) => {
  storeData.set('player', args);
});

ipcMain.on('set-player-config', (event, args) => {
  storeData.set('config', args);
  app.relaunch();
  app.exit();
});

ipcMain.on('get-app-version', function (event, arg) {
  aboutWindow.webContents.send('sender-app-version', { version: app.getVersion() });
});

ipcMain.on('open-dialog', (event, args) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Контент',
        extensions: ['jpg', 'png', 'giff', 'mp4', 'avi', 'ogg'],
      },
    ],
  })
    .then((data) => {
      configWindow.webContents.send('set-file', { ...data, uuid: args.uuid });
    })
    .catch((error) => {
      log.error(`error file - ${error}`);
    });
});

ipcMain.on('get-player-config', function (event, arg) {
  getPlayerConfig();
});

ipcMain.on('check-update', function (event, arg) {
  checkForUpdate();
});

ipcMain.on('log-info', function (event, arg) {
  log.info(arg);
});

ipcMain.on('connection-restored', function (event, arg) {
  log.error('connection restored');
  sendNotify('connected');
});

ipcMain.on('get-settings', function (event, arg) {
  configWindow.webContents.send('set-settings', storeData.get('config'));
});

// При загрузке обновления происходит автоматическая установка
autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded');
  sendNotify('updated');
  autoUpdater.quitAndInstall();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    center: true,
    width: 1500,
    height: 1800,
    autoHideMenuBar: true,
    fullscreen: true,
    type: 'toolbar',
    preload: path.join(app.getAppPath(), 'preload.js'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
    }
  });
  mainWindow.loadURL(`file://${__dirname}/dist-electron/index.html`);

  const template = [
    {
      label: "Настройки",
      click: () => {
        configWindow = new BrowserWindow({
          width: 900,
          height: 900,
          parent: mainWindow,
          title: 'Настройки',
          modal: true,
          resizable: false,
          icon: './build/icon.ico',
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
        });
        configWindow.webContents.send('player-rotation-config', storeData.get('config'))
        configWindow.loadURL(`file://${__dirname}/dist-electron/index.html#/settings`)
        configWindow.setMenu(null);
      },
    },
    {
      label: "Инструменты",
      submenu: [
        { role: "toggledevtools" },
      ]
    },
    {
      label: "О приложении",
      click: () => {
        aboutWindow = new BrowserWindow({
          width: 550,
          height: 700,
          parent: mainWindow,
          title: 'О приложении',
          modal: true,
          resizable: false,
          icon: './build/icon.ico',
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
          }
        });
        aboutWindow.loadURL(`file://${__dirname}/dist-electron/index.html#/about`);
        aboutWindow.setMenu(null);
      },
    },
  ];

  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('blur', ()=>{
    setTimeout(() => mainWindow.focus(), 100000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    configWindow = null;
    aboutWindow = null;
  });
}

function checkPhotoWorkTable() {
  const HOUR = 3600000;

  clearInterval(intervalIdForSendPhotoWorkTable);

  // Отпавка скриншотов в бот 1 раз в час
  intervalIdForSendPhotoWorkTable = setInterval(() => sendPhotoWorkTable(), HOUR);
}

function sendPhotoWorkTable(){
  desktopCapturer.getSources({
    types: ['screen'], thumbnailSize: {
      height: 1920,
      width: 1080,
    }
  }).then(sources => {
    const playerConfig = storeData.get('config') || {};

    const date = new Date();
    const time = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;

    const info1 = `#player${playerConfig.playerSettings.playerNumber} ${time} v${app.getVersion()} \n`;
    const info2 = `${playerConfig.playerSettings.organization ?? ''}, ${playerConfig.playerSettings.address ?? ''} \n`;
    const info3 = `${playerConfig.playerSettings.responsible ?? ''}, ${playerConfig.playerSettings.phone ?? ''}`;

    bot.sendPhoto(
        playerConfig.playerSettings.telegramChatID,
        sources[0].thumbnail.toJPEG(50),
        {
          caption: `${info1}${info2}${info3}`,
        },
        {
          filename: `${info1}`,
        },
    ).then();
  });
}

function sendNotify(status) {
  const playerConfig = storeData.get('config') || {};

  if (!playerConfig.playerSettings || !playerConfig.playerSettings.telegramChatID) {
    return;
  }

  const data = [
    `Номер плеера: ${statuses[status]} #player${playerConfig.playerSettings.playerNumber}${statuses[status]}`,
    `AnyDeskID: ${playerConfig.playerSettings.anydeskId}`,
    `Версия плеера: ${app.getVersion()}`,
    `Проект: ${playerConfig.playerSettings.project}`,
    `Организация: ${playerConfig.playerSettings.organization}`,
    `Адрес: ${playerConfig.playerSettings.address}`,
    `Ответственный: ${playerConfig.playerSettings.responsible}`,
    `Телефон: ${playerConfig.playerSettings.phone}`,
  ];

  bot.sendMessage(playerConfig.playerSettings.telegramChatID, data.join('\n'))
    .then(() => log.info(status))
    .catch((error) => log.error(`Ошибка при отправке status - ${error}`));

  sendStatus(status).then();
}

function checkForUpdate() {
  autoUpdater.checkForUpdates().catch((error) => {
    log.error(`error checkForUpdates - ${error}`);
  });
}

function setDateTime(hours, minutes) {
  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return date;
}

function getPlayerConfig() {
  const config = storeData.get('config') || {};

  if (!config.playlistSettings || !config.playlistSettings.start || !config.playlistSettings.end) {
    return;
  }

  const playerStart = config.playlistSettings.start.split(':');
  const playerEnd = config.playlistSettings.end.split(':');

  ruleStart = new schedule.RecurrenceRule();
  ruleStart.hour = Number(playerStart[0]) || 0;
  ruleStart.minute = Number(playerStart[1]) || 0;

  ruleEnd = new schedule.RecurrenceRule();
  ruleEnd.hour = Number(playerEnd[0]) || 0;
  ruleEnd.minute = Number(playerEnd[1]) || 0;

  const currentDate = new Date();
  const startDateTime = setDateTime(ruleStart.hour, ruleStart.minute);
  const endDateTime = setDateTime(ruleEnd.hour, ruleEnd.minute);
  const currentTime = currentDate.getTime();

  if (currentTime >= startDateTime.getTime() && currentTime < endDateTime.getTime()) {
    mainWindow.webContents.send('player-rotation-config', config);
  } else {
    mainWindow.webContents.send('black-window', 'sleep');
  }

  setSchedule(ruleStart, ruleEnd);
}

function setSchedule(ruleStart, ruleEnd) {
  for (const job in schedule.scheduledJobs) {
    schedule.cancelJob(job);
  }

  schedule.scheduleJob(ruleStart, function () {
    checkForUpdate(mainWindow);

    const config = storeData.get('config');
    mainWindow.webContents.send('player-rotation-config', config);
    sendNotify('awake');
  });

  schedule.scheduleJob(ruleEnd, function () {
    checkForUpdate(mainWindow);
    mainWindow.webContents.send('black-window', 'sleep');
    sendNotify('sleeping');

    const playerConfig = storeData.get('config');
    const date = new Date();
    const formattedDate = `${date.getDate()}_${date.getMonth()}_${date.getFullYear()}`;

    if (playerConfig && playerConfig.playerSettings.telegramChatID) {
      bot.sendDocument(playerConfig.playerSettings.telegramChatID, fs.createReadStream(logPath), {}, {
        filename: `#player${playerConfig.playerSettings.playerNumber}-v${app.getVersion()}-${formattedDate}.log`
      })
        .then(() => log.info('log отправлен'))
        .catch((error) => log.error(`Ошибка при отправке log - ${error}`));
    }
  });
}

function generateToken() {
  Promise.all([si.osInfo(), si.baseboard()]).then((values) => {
    const data = [values[0].serial, values[1].model];
    const info = data.join(',');
    const token = crypto.createHash('sha1')
      .update(info)
      .digest('hex');

    if (token) {
      storeData.set('token', token);
    }
  });
}

function checkStatus() {
  const HOUR = 3600000;
  clearInterval(intervalIdForSendStatus);

  // Отпавка статусов 1 раз в час
  intervalIdForSendStatus = setInterval(() => sendStatus('working'), HOUR);
}

const sendStatus = async (status) => {
  const player = storeData.get('player') || null;
  const token = storeData.get('token') || null;

  if (!player || !token) return;

  desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      height: 700,
      width: 700,
    }
  }).then(async sources => {
    const form = new FormData();
    const file = sources[0].thumbnail.toDataURL();

    form.append('file', dataURItoBlob(file), 'screen.jpg');
    form.append('data', JSON.stringify({
      status,
      'status_at': new Date().toISOString(),
    }));

    try {
      const response = await axios.post(
        `https://player.${player.project.domain}/v1/statuses/${player.id}/`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      log.info(error)
    }
  });
};

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  const byteString = atob(dataURI.split(',')[1]);
  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  // create a view into the buffer
  const ia = new Uint8Array(ab);
  // set the bytes of the buffer to the correct values
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], {type: mimeString});

  return blob;
}

async function processPlayerData(playerId) {
  const token = storeData.get('token');
  if (!token) return;

  try {
    const response = await axios.get(
      `${methods.player[mode]}/v1/players/${playerId}/`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const player = response.data;
    storeData.set('player', player);

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: Object.assign({
          "Content-Security-Policy": [
            `connect-src https://player.${player.project.domain}/ ${allowedDomains['connect-src']};
                   default-src: ${allowedDomains['default-src']}
                   img-src: ${allowedDomains['img-src']}
                   style-src: ${allowedDomains['style-src']}
                   font-src: ${allowedDomains['font-src']}
                  `,
          ]
        }, details.responseHeaders),
      });
    });
  } catch (error) {
    log.info(error)
  }
}

function launchApp() {
  createWindow();
  checkStatus();
  sendNotify('running');

  if (mode === 'prod') {
    checkForUpdate();
    checkPhotoWorkTable();
  }
}
