const { app, BrowserWindow, Menu } = require('electron');

let configWindow, mainWindow;

let mainWindowOptions = {
  center: true,
  width: 1500,
  height: 1800,
  // autoHideMenuBar: true,
  // fullscreen: true,
};

function createWindow () {
  mainWindow = new BrowserWindow(mainWindowOptions);
  mainWindow.loadURL(`file://${__dirname}/dist-electron/index.html`);
  mainWindow.webContents.openDevTools();

  const template = [
    {
      label: "Настройки",
      click: () => {
        configWindow = new BrowserWindow({
          width: 800,
          height: 700,
          parent: mainWindow,
          title: 'Настройки',
          modal: true,
          // resizable: false,
          icon: './build/icon.ico',
        });

        configWindow.loadURL(`file://${__dirname}/dist-electron/index.html#/settings`);
        configWindow.webContents.openDevTools();

        configWindow.on('closed', () => {
          // setSchedule().then(() => {});
          app.relaunch();
          app.exit();
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
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
