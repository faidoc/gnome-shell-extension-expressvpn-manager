/**
 @author Alexandre Filgueira <faidoc@gmail.com>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

'use strict';

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const St = imports.gi.St;
const MessageTray = imports.ui.messageTray;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


// Lets you run a function in asynchronous mode using GLib
// @parameter fn : the function to run
// @parameter callback : the function to call after fn
function async(fn, callback) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, function () {
        // let funRes = fn();
        callback(fn());
    }, null);
}

function showNotification (title, message) {
    let notification = null;

    if (this._notifSource == null) {
        // We have to prepare this only once
        this._notifSource = new MessageTray.SystemNotificationSource();
        this._notifSource.createIcon = function() {
            let gicon = Gio.icon_new_for_string(Me.path + "/icons/icon.png");
            return new St.Icon({ gicon: gicon});
        };
        // Take care of note leaving unneeded sources
        this._notifSource.connect('destroy', Lang.bind(this, function() {this._notifSource = null;}));
        Main.messageTray.add(this._notifSource);
    }

    notification = new MessageTray.Notification(this._notifSource, title, message);

    notification.setTransient(false);
    this._notifSource.notify(notification);
}

function expressVPNStatusNotification(action) {
    let [res, out, err, status] = GLib.spawn_command_line_sync('bash -c "expressvpn status"');

    if(status === 0) {
        let outStr = String.fromCharCode.apply(String, out);
        let connectionStatus = outStr.split('\n');

        for(let i = 0; i < connectionStatus.length-1; i++) {
            if(action === 'connect') {
                if(connectionStatus[i].indexOf('Connected') > -1) {
                    showNotification('ExpressVPN Status', 'Successfully connected to ' + connectionStatus[i]);
                }
            } else if(action === 'disconnect') {
                if(connectionStatus[i].indexOf('Not connected') > -1) {
                    showNotification('ExpressVPN Status', 'Successfully disconnected');
                }
            }
        }
    } else {
        let errMsg = "Error occurred when checking ExpressVPN Status";
        log(errMsg);
        log(err);
        showNotification('ExpressVPN Error', errMsg);
    }
}