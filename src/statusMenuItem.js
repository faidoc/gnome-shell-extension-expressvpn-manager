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
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.src.util;

const StatusMenuItem = new Lang.Class({
    Name: 'ExpressVPNMenu.StatusMenuItem',
    Extends: PopupMenu.PopupMenuItem,

    _init : function(label) {
      	this.parent(label);

        this.connect('activate', Lang.bind(this, this._clickAction));
    },

    _clickAction: function() {
        let success, pid;

        [success, pid] = GLib.spawn_async_with_pipes(
            null,
            ['/bin/bash', '-c', 'expressvpn disconnect'],
            null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null );

        if (success  &&  pid !== 0) {
            // Wait for answer
            log("created process, pid=" + pid);

            GLib.child_watch_add( GLib.PRIORITY_DEFAULT, pid, function(pid,status) {
                GLib.spawn_close_pid(pid);
                log("process completed, status=" + status);
                Util.expressVPNStatusNotification('disconnect');
            });
        } else {
            log('Failed to create process');
        }
    }

});
