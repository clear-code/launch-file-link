/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

load('lib/WindowManager');

Components.utils.import('resource://gre/modules/Services.jsm');

var bundle = require('lib/locale')
               .get('chrome://launch-file-link/locale/launch-file-link.properties');

var lastState = new WeakMap();

function handleLinkClick(aEvent) {
  if (aEvent.button != 0)
    return true;

  var target = aEvent.originalTarget;
  while (target && !target.href) {
    target = target.parentNode;
  }
  if (!target || !target.parentNode)
    return true;

  var url = target.href;
  if (url.indexOf('file:') != 0)
    return true;

  aEvent.stopPropagation();
  aEvent.preventDefault();

  var FileHandler = Services.io.getProtocolHandler('file')
                      .QueryInterface(Ci.nsIFileProtocolHandler);
  try {
    var file = FileHandler.getFileFromURLSpec(url);
    file = file.QueryInterface(Ci.nsILocalFile);
    var view = target.ownerDocument.defaultView;

    var confirmed = lastState.get(view);
    if (confirmed == undefined) {
      let messageType = file.isDirectory() ? 'folder' : 'file';
      let checked = { value: false };
      confirmed = Services.prompt.confirmCheck(
        view,
        bundle.getString('confirm.title'),
        bundle.getFormattedString('confirm.message.' + messageType, [file.parent.path, file.leafName]),
        bundle.getString('confirm.check'),
        checked
      );
      if (checked.value)
        lastState.set(view, confirmed);
    }

    if (!confirmed)
      return false;

    file.launch();
  }
  catch(aError) {
    Cu.reportError(new Error('failed to open a file URL <' + url + '>\n' + aError.message));
  }
  finally {
    return false;
  }
}

function handleSubWindowUnload(aEvent) {
  var view = aEvent.originalTarget;
  view = view.ownerDocument || view;
  view = view.defaultView;
  lastState.delete(view);
}

function handleWindowUnload(aEvent) {
  var view = aEvent.originalTarget;
  view = view.ownerDocument || view;
  view = view.defaultView;
  lastState.delete(view);
  view.removeEventListener('unload', handleSubWindowUnload, true);
  view.removeEventListener('click', handleLinkClick, true);
}

function handleWindow(aWindow) {
  aWindow.addEventListener('click', handleLinkClick, true);
  aWindow.addEventListener('unload', handleSubWindowUnload, true);
  aWindow.addEventListener('unload', handleWindowUnload, false);
}

WindowManager.getWindows().forEach(handleWindow);
WindowManager.addHandler(handleWindow);

function shutdown()
{
  WindowManager.getWindows().forEach(function(aWindow) {
    aWindow.removeEventListener('click', handleLinkClick, true);
    aWindow.removeEventListener('unload', handleSubWindowUnload, true);
    aWindow.removeEventListener('unload', handleWindowUnload, false);
  });
  WindowManager.removeHandler(handleWindow);

  handleWindow = undefined;
  handleLinkClick = undefined;
  bundle = undefined;
  lastState = undefined;

  Services = undefined;
  WindowManager = undefined;
}
