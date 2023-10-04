const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require('fs');
const electron = require("electron");
const path = require("path");
const schedule = require('node-schedule');

const TelegramBot = require('node-telegram-bot-api');

let aboutWindow, configWindow, mainWindow;
let ruleStart, ruleEnd;
let bot, userDataPath, logPath;
let mainWindowOptions = {
  center: true,
  width: 1500,
  height: 1800,
  autoHideMenuBar: true,
  fullscreen: true,
  type: 'toolbar',
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    nodeIntegrationInWorker: true,
  }
};

const Store = require(`${__dirname}/core/store.ts`)
const storeData = new Store({
  configName: 'user-preferences',
  defaults: {
    config: {},
  },
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (!mainWindow) createWindow();
})

const gotTheLock = app.requestSingleInstanceLock();
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
    const playerConfig = storeData.get('config');

    bot = new TelegramBot(playerConfig.playerSettings.telegramBotToken);
    userDataPath = (electron.app || electron.remote.app).getPath('userData');
    logPath = path.join(userDataPath, 'logs/main.log');

    createWindow();
    sendNotify('Запустился');
    checkForUpdate(mainWindow);

    globalShortcut.register('Escape', function () {
      app.quit();
    });
  })
}

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

ipcMain.on('connection-restored', function (event, arg) {
  log.error('connection restored');
  sendNotify('Соединение восстановлено');
});

ipcMain.on('get-settings', function (event, arg) {
  configWindow.webContents.send('set-settings', storeData.get('config'));
});

// При загрузке обновления происходит автоматическая установка
autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded');
  sendNotify('Идет обновление');
  autoUpdater.quitAndInstall();
});

function createWindow() {
  mainWindow = new BrowserWindow(mainWindowOptions);
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

  mainWindow.on('closed', () => {
    mainWindow = null;
    configWindow = null;
    aboutWindow = null;
  });
}

function sendNotify(status) {
  const statuses = {
    'Идет обновление': '💿',
    'Заснул': '💤',
    'Проснулся': '✅',
    'Запустился': '🚀',
    'Соединение восстановлено': '⚠️',
  }
  const playerConfig = storeData.get('config');
  const data = [
    `Номер плеера: #player${playerConfig.playerSettings.playerNumber}`,
    `AnyDeskID: ${playerConfig.playerSettings.anydeskId}`,
    `Версия плеера: ${app.getVersion()}`,
    `Проект: ${playerConfig.playerSettings.project}`,
    `Организация: ${playerConfig.playerSettings.organization}`,
    `Адрес: ${playerConfig.playerSettings.address}`,
    `Ответственный: ${playerConfig.playerSettings.responsible}`,
    `Телефон: ${playerConfig.playerSettings.phone}`,
    `Статус:  ${statuses[status]} ${status} ${statuses[status]}`,
  ];

  bot.sendMessage(playerConfig.playerSettings.telegramChatID, data.join('\n'))
    .then(() => log.info(status))
    .catch((error) => log.error(`Ошибка при отправке status - ${error}`));
}

function checkForUpdate(mainWindow) {
  autoUpdater.checkForUpdates().catch((error) => {
    log.error(`error checkForUpdates - ${error}`);
    mainWindow.webContents.send('black-window', 'checkForUpdates' + error);
  });
}

function setDateTime(hours, minutes) {
  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return date;
}

function getPlayerConfig() {
  const config = storeData.get('config');

  if (!config.playlistSettings.start || !config.playlistSettings.end) {
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
    sendNotify('Проснулся');
  });

  schedule.scheduleJob(ruleEnd, function () {
    checkForUpdate(mainWindow);
    mainWindow.webContents.send('black-window', 'sleep');
    sendNotify('Заснул');

    const playerConfig = storeData.get('config');
    const date = new Date();
    const formattedDate = `${date.getDate()}_${date.getMonth()}_${date.getFullYear()}`;

    bot.sendDocument(playerConfig.playerSettings.telegramChatID, fs.createReadStream(logPath), {}, {
      filename: `#player${playerConfig.playerSettings.playerNumber}-v${app.getVersion()}-${formattedDate}.log`
    })
      .then(() => log.info('log отправлен'))
      .catch((error) => log.error(`Ошибка при отправке log - ${error}`));
  });
}
