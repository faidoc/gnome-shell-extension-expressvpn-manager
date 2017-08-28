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
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.src.util;

const ExpressVPNMenuStatusItem = new Lang.Class({
    Name: 'ExpressVPNMenu.ExpressVPNMenuStatusItem',
    Extends: PopupMenu.PopupSwitchMenuItem,

    _init : function(itemLabel) {
        // Get current ExpressVPN status
        this.expressVPNStatus = this._getExpressVPNStatus();
        log('ExpressVPN status: ' + this.expressVPNStatus);

        // Set Switch state
        this.parent(itemLabel, this.expressVPNStatus);

        this.connect('activate', Lang.bind(this, this._clickAction));
    },

    _getExpressVPNStatus: function() {
    	let statusCmd = 'sh -c "systemctl is-active expressvpn.service --system; exit;"';
    	let res, out, err, status;
    	[res, out, err, status] = GLib.spawn_command_line_sync(statusCmd);
    	return (status === 0);
	},

	_callbackExpressVPNAction : function(funRes) {
        if(funRes['status'] === 0) {
            let msg = "`" + funRes['cmd'] + "` terminated successfully";
            log(msg);
        } else {
            let errMsg = "Error occurred when running `" + funRes['cmd'] + "`";
            Main.notify(errMsg);
            log(errMsg);
            log(funRes['err']);
    	}
    },

    _clickAction : function() {
    	// TODO: Detect if systemctl and pkexec are installed
    	let serviceAction = this.expressVPNStatus ? 'stop' : 'start';
        let serviceCmd = 'sh -c "pkexec --user root systemctl ' + serviceAction + ' expressvpn.service --system; exit;"';
        let res, out, err, status;
        log("Let's " + serviceAction + " ExpressVPN...");
        Util.async(function() {
            [res, out, err, status] = GLib.spawn_command_line_async(serviceCmd);
            return {
              cmd: serviceCmd,
              res: res,
              out: out,
              err: err,
              status: status
            };
        }, this._callbackExpressVPNAction);
    }

});
