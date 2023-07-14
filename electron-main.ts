const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, net } = require('electron');
const { autoUpdater } = require('electron-updater');

const schedule = require('node-schedule');

let aboutWindow, configWindow, mainWindow;
let mainWindowOptions = {
  center: true,
  width: 1500,
  height: 1800,
  autoHideMenuBar: true,
  fullscreen: true,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
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
  if (mainWindow === null) createWindow()
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
    createWindow();
    setSchedule();

    setTimeout(() => {
      autoUpdater.checkForUpdates().then(() => {});
    }, 10000);

    globalShortcut.register('Escape', function () {
      app.quit();
    });
  })
}

ipcMain.on('set-player-config', (event, args) => {
  storeData.set('config', args);
  setSchedule();
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
    .catch((error) => console.log('error file', error));
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
        ipcMain.on('get-player-config', () => {
          configWindow.webContents.send('player-rotation-config', storeData.get('config'));
        });

        configWindow.loadURL(`file://${__dirname}/dist-electron/index.html#/settings`);
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
  const playerConfig = storeData.get('config');
  const data = [
    `Номер плеера: %20%23player${playerConfig.playerSettings.playerNumber}%0A`,
    `AnyDeskID: ${playerConfig.playerSettings.anydeskId}%0A`,
    `Проект: ${playerConfig.playerSettings.project}%0A`,
    `Организация: ${playerConfig.playerSettings.organization}%0A`,
    `Адрес: ${playerConfig.playerSettings.address}%0A`,
    `Ответственный: ${playerConfig.playerSettings.responsible}%0A`,
    `Телефон: ${playerConfig.playerSettings.phone}%0A`,
    `Статус:  ${status}`,
  ];

  const params = `chat_id=${playerConfig.playerSettings.telegramChatID}&text=${data.join('')}`;
  const path = `https://api.telegram.org/bot${playerConfig.playerSettings.telegramBotToken}/sendMessage?${params}`;
  const request = net.request(path);

  request.end();
}

function setSchedule() {
  const config = storeData.get('config');

  if (!config.playlistSettings.start || !config.playlistSettings.end) {
    return;
  }
  const playerStart = config.playlistSettings.start.split(':');
  const playerEnd = config.playlistSettings.end.split(':');

  let ruleStart = new schedule.RecurrenceRule();
  ruleStart.hour = Number(playerStart[0]) || 0;
  ruleStart.minute = Number(playerStart[1]) || 0;

  let ruleEnd = new schedule.RecurrenceRule();
  ruleEnd.hour = Number(playerEnd[0]) || 0;
  ruleEnd.minute = Number(playerEnd[1]) || 0;

  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  const isExistence = ruleStart.hour || ruleStart.minute || ruleEnd.hour || ruleEnd.minute;
  const isCurrentStart = currentHour > ruleStart.hour || (currentHour === ruleStart.hour && currentMinutes > ruleStart.minute);
  const isCurrentEnd = currentHour < ruleEnd.hour || (currentHour === ruleEnd.hour && currentMinutes < ruleEnd.minute);

  if (isExistence && isCurrentStart && isCurrentEnd) {
    ipcMain.on('get-player-config', function (event, arg) {
      mainWindow.webContents.send('player-rotation-config', config);
    });
  } else {
    mainWindow.webContents.send('black-window', []);
  }

  sendNotify('Запустился');
  checkForUpdate();

  schedule.scheduleJob(ruleStart, function () {
    mainWindow.webContents.send('player-rotation-config', config);
    checkForUpdate();
    sendNotify('Проснулся');
  });

  schedule.scheduleJob(ruleEnd, function () {
    mainWindow.webContents.send('black-window', []);
    sendNotify('Заснул');
  });
}

// При загрузке обновления происходит автоматическая установка
autoUpdater.on('update-downloaded', () => {
  sendNotify('Идет обновление');
  autoUpdater.quitAndInstall();
});

function checkForUpdate() {
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 10000);
}
