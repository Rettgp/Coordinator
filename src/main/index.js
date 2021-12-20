'use strict'

import { app, BrowserWindow } from 'electron'
import {autoUpdater} from "electron-updater";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development')
{
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

autoUpdater.requestHeaders = { "PRIVATE-TOKEN": "glpat-eVURzGFd-5kyda7MbPCg" };
autoUpdater.autoDownload = true;
autoUpdater.setFeedURL({
    provider: "generic",
    url: "http://gitlab.com/api/v4/projects/18471086/jobs/artifacts/master/raw/dist?job=publish"
});


let mainWindow
const winURL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`

function createWindow()
{
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,
            enableRemoteModule: true
        },
        height: 563,
        useContentSize: true,
        width: 1000,
        title: "Coordinator",
    })

    mainWindow.loadURL(winURL)

    mainWindow.on('closed', () =>
    {
        mainWindow = null
    })

    autoUpdater.on('checking-for-update', function ()
    {
        mainWindow.webContents.send("auto-updater-event", "Checking For Update.");
    });

    autoUpdater.on('update-available', function (info)
    {
        mainWindow.webContents.send("auto-updater-event", "Update Available.");
    });

    autoUpdater.on('update-not-available', function (info)
    {
        mainWindow.webContents.send("auto-updater-event", "Latest.");
    });

    autoUpdater.on('error', function (err)
    {
        mainWindow.webContents.send("auto-updater-event", "Error In Auto Updater.");
    });

    autoUpdater.on('download-progress', function (progressObj)
    {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + parseInt(progressObj.percent) + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        mainWindow.webContents.send("auto-updater-event", log_message);
    });

    autoUpdater.on('update-downloaded', function (info)
    {
        mainWindow.webContents.send("auto-updater-event", 'Update downloaded; will install in 1 seconds');
    });

    autoUpdater.on('update-downloaded', function (info)
    {
        setTimeout(function () {
            autoUpdater.quitAndInstall();
        }, 1000);
    });
    autoUpdater.checkForUpdates();
}

app.on('ready', createWindow)

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin')
    {
        app.quit()
    }
})

app.on('activate', () =>
{
    if (mainWindow === null)
    {
        createWindow()
    }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
