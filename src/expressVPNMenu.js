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

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ExpressVPNSubMenuMenuItem = Me.imports.src.expressVPNSubMenuMenuItem;
const ExpressVPNMenuStatusItem = Me.imports.src.expressVPNMenuStatusItem;
const StatusSubMenuMenuItem = Me.imports.src.statusSubMenuMenuItem;

// ExpressVPN icon on status menu
const ExpressVPNMenu = new Lang.Class({
    Name: 'ExpressVPNMenu.ExpressVPNMenu',
    Extends: PanelMenu.Button,

    // Init the ExpressVPN menu
    _init: function() {
        this.parent(0.0, _("ExpressVPN"));

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        let gicon = Gio.icon_new_for_string(Me.path + "/icons/icon.svg");
        let expressVPNIcon = new St.Icon({ gicon: gicon, icon_size: '24'});

        hbox.add_child(expressVPNIcon);
        this.actor.add_child(hbox);

        this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

        this._renderMenu();
    },

    // Refresh  the menu everytime the user click on it
    _refreshMenu : function() {
        if(this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    // Checks if expressVPN is installed on the host machine
    _isExpressVPNInstalled: function() {
        return GLib.find_program_in_path('expressvpn') !== undefined;
    },

    // Checks if the ExpressVPN daemon is running or not
    _isExpressVPNRunning: function() {
        let [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(null, ['/bin/ps', 'cax'], null, 0, null);

        let out_reader = new Gio.DataInputStream({
          base_stream: new Gio.UnixInputStream({fd: out_fd})
        });

        // Look for the ExpressVPN process running
        let expressVPNRunning = false;
        let hasLine = true;
        do {
            let [out, size] = out_reader.read_line(null);
            if(out !== null && out.toString().indexOf("expressvpn") > -1) {
                expressVPNRunning = true;
            } else if(size <= 0) {
                hasLine = false;
            }

        } while(!expressVPNRunning && hasLine);

        return expressVPNRunning;
    },

    _expressVPNStatus: function() {
        let expressVPNStatus = 'Not Connected.';
        let [res, out, err, status] = GLib.spawn_command_line_sync('bash -c "expressvpn status"');

        if(status === 0) {
            let outStr = String.fromCharCode.apply(String, out);
            let connectionStatus = outStr.split('\n');

            for(let i = 0; i < connectionStatus.length-1; i++) {
                expressVPNStatus = connectionStatus[i];
            }
        } else {
            let errMsg = "Error occurred when checking ExpressVPN Status";
            log(errMsg);
            log(err);
        }

        return expressVPNStatus;
    },

    // Show ExpressVPN menu icon only if installed
    _renderMenu: function() {
        if(this._isExpressVPNInstalled()) {
            let expressStatus = this._expressVPNStatus() !== 'Not connected.';
            let connectionStatus = null;

            // Add Turn On / Turn Off Switch always
            let statusSwitch = new ExpressVPNMenuStatusItem.ExpressVPNMenuStatusItem(_('ExpressVPN status'));
            if ( expressStatus && this._isExpressVPNRunning() ) {
                connectionStatus = new StatusSubMenuMenuItem.StatusSubMenuMenuItem(this._expressVPNStatus());
            } else {
                connectionStatus = new PopupMenu.PopupMenuItem(this._expressVPNStatus());
            }

            this.menu.addMenuItem(statusSwitch);
            this.menu.addMenuItem(connectionStatus);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

			if(this._isExpressVPNRunning()) {
                let subMenu = new ExpressVPNSubMenuMenuItem.ExpressVPNSubMenuMenuItem(_('Available countries'));
                this.menu.addMenuItem(subMenu);
		    } else {
				let errMsg = _("ExpressVPN daemon not started");
				this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));

				log(errMsg);
			}
        } else {
              let errMsg = _("ExpressVPN binary not found in PATH");
              this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
              log(errMsg);
        }
        this.actor.show();
    }
});

