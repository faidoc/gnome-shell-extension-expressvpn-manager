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

const GLib = imports.gi.GLib;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ExpressVPNMenuItem = Me.imports.src.expressVPNMenuItem;

const ExpressVPNSubMenuMenuItem = new Lang.Class({
    Name: 'ExpressVPNMenu.ExpressVPNSubMenuMenuItem',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function(label) {
        this.parent(label);

        this._feedMenu();
    },

    _feedMenu: function() {
        let [res, out, err, status] = GLib.spawn_command_line_sync('bash -c "expressvpn list | cut -f 1-2 | tail -n +3"');

        if(status === 0) {
            let outStr = String.fromCharCode.apply(String, out);
            let fullRegionsList = outStr.split('\n');
            let numberRegions = fullRegionsList.length-1;

            if (numberRegions) {
                for(let i = 0; i < numberRegions; i++) {
                    let regionSplited = fullRegionsList[i].split("\t");
                    if( regionSplited[1] !== '' ) {
                        let subItem = new ExpressVPNMenuItem.ExpressVPNMenuItem(regionSplited[0], regionSplited[1]);
                        this.menu.addMenuItem(subItem);
                    }
                }
            } else {
                let noRegionsMsg = "No regions detected";
                this.menu.addMenuItem(new PopupMenu.PopupMenuItem(noRegionsMsg));
            }
        } else {
            let errMsg = "Error occurred when fetching regions";
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
            log(errMsg);
            log(err);
        }
    }
});
