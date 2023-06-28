const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');

const schedule = require('node-schedule');

let configWindow, mainWindow;
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

// Инициализация пользовательских данных
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

// При попытке создать новое окно, проверяется наличие основного окна,
// если оно существует, то происходит его активация
// если нет, то создается
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

// Запись конфигурации в Store
ipcMain.on('set-player-config', (event, args) => {
  storeData.set('config', args);
  setSchedule();
  app.relaunch();
  app.exit();
});

ipcMain.on('open-dialog', (event, args) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Картинки',
        extensions: ['jpg', 'png', 'giff']
      },
      {
        name: 'Видео',
        extensions: ['mp4', 'mov']
      }
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
          width: 700,
          height: 800,
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

        configWindow.loadURL(`file://${__dirname}/dist-electron/index.html#/settings`);

        // Получение конфигурации из Store
        ipcMain.on('get-player-config', () => {
          configWindow.webContents.send('player-rotation-config', storeData.get('config'));
        });
      },
    },
    {
      label: "Инструменты",
      submenu: [
        { role: "toggledevtools" },
      ]
    },
  ];

  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
    configWindow = null;
  });
}

// Установка расписания плеера
function setSchedule() {
  const playerConfig = storeData.get('config');

  if (!playerConfig.start || !playerConfig.end) {
    return;
  }
  const playerStart = playerConfig.start.split(':');
  const playerEnd = playerConfig.end.split(':');

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
      mainWindow.webContents.send('player-rotation-config', playerConfig);
    });
    checkForUpdate();
  } else {
    mainWindow.webContents.send('black-window', []);
  }

  schedule.scheduleJob(ruleStart, function () {
    mainWindow.webContents.send('player-rotation-config', playerConfig);
    checkForUpdate();
  });

  schedule.scheduleJob(ruleEnd, function () {
    mainWindow.webContents.send('black-window', []);
  });
}

// При загрузке обновления происходит автоматическая установка
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

function checkForUpdate() {
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 10000);
}
