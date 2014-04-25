/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

load('lib/WindowManager');

function handleLinkClick(aEvent) {
  var target = aEvent.originalTarget;
  while (target && !target.href) {
    target = target.parentNode;
  }
  if (!target || !target.parentNode)
    return true;

  var url = target.href;
  if (url.indexOf('file:') != 0)
    return true;

  target.ownerDocument.defaultView.alert(url);

  aEvent.stopPropagation();
  aEvent.preventDefault();
  return false;
}

function handleWindow(aWindow)
{
  aWindow.addEventListener('click', handleLinkClick, true);
  aWindow.addEventListener('unload', function() {
    aWindow.removeEventListener('click', handleLinkClick, true);
  }, false);
}

WindowManager.getWindows().forEach(handleWindow);
WindowManager.addHandler(handleWindow);

function shutdown()
{
  WindowManager.getWindows().forEach(function(aWindow) {
    aWindow.removeEventListener('click', handleLinkClick, true);
  });
  WindowManager.removeHandler(handleWindow);

  handleWindow = undefined;
  handleLinkClick = undefined;

  WindowManager = undefined;
}
