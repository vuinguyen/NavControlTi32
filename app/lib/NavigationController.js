// Note: This version works for Android and iOS for Titanium 3.2.0. 
// Most of the changes to make it compatible with Ti 3.2.0 were:
// this.navGroup.close(someWindow) changed to this.navGroup.closeWindow(someWindow)
// most of the time
// this.navGroup.open(someWindow) changed to this.navGroup.openWindow(someWindow)
// most of the time


function NavigationController() {
	this.windowStack = [];
};

// Note: without a parameter, close automatically closes 1 window
NavigationController.prototype.close = function(numWindows) {
	Ti.API.log("close function.");
	if ((this.windowStack.length > 1) && (numWindows > 1)) {
		// setup chain reaction by setting up the flags on all the windows
		var i = this.windowStack.length - 1;
		for (var j = 1; j < numWindows; j++)
		{
			// set dependent window
			this.windowStack[i].fireEvent('set.to.close', {win: this.windowStack[i - 1]});
			i--;
       	}
        // start chain reaction, close first window
		(this.navGroup) ? this.navGroup.closeWindow(this.windowStack[this.windowStack.length - 1]) : this.windowStack[this.windowStack.length - 1].close();
	}
	else
	{
		(this.navGroup) ? this.navGroup.closeWindow(this.windowStack[this.windowStack.length - 1]) : this.windowStack[this.windowStack.length - 1].close();
	}
	Ti.API.log("End Home. Stack: " + this.windowStack.map(function(v) {return v.title;}));
};

NavigationController.prototype.open = function(/*Ti.UI.Window*/windowToOpen) {
	Ti.API.log("Open function.");
	//add the window to the stack of windows managed by the controller
	this.windowStack.push(windowToOpen);

	//grab a copy of the current nav controller for use in the callback
	var that = this;
	var lastPushed = windowToOpen;
	windowToOpen.addEventListener('close', function() {
		if (that.windowStack.length > 1) // don't pop the last Window, which is the base one
		{
			Ti.API.log("Event 'close': " + this.title);
			var popped = that.windowStack.pop();
		
			if (lastPushed != popped)
			{
				Ti.API.info("Last window should NOT have been popped. Push it back on the stack!");
				that.windowStack.push(popped);
			}
			
			// close dependent window ?
			if (this.toClose) {
				Ti.API.log("Invoke close on dependent window:" + this.toClose.title);
			 	// close "parent" window, do not use animation (it looks weird with animation)
			 	//(that.navGroup) ? that.navGroupWindow.close(this.toClose, {animated : false}) : this.toClose.close({animated:false});
			 	(that.navGroup) ? that.navGroup.closeWindow(this.toClose, {animated : true}) : this.toClose.close({animated:true});
			}
			
			// open dependent window ?
			if (this.toOpen) {
				Ti.API.log("Invoke open on dependent window:" + this.toOpen.title);
			 	that.open(this.toOpen);
			} 
		
			Ti.API.log("End event 'close'. Stack: " + that.windowStack.map(function(v) {return v.title;}));
		} // end if windowStack.length > 1, and end of my hack
	}); // end eventListener 'close'
	
	windowToOpen.addEventListener('set.to.close', function(dict) {
		Ti.API.log("Event 'set.to.close': " + this.title);
		this.toClose = dict.win;
	});
	
	windowToOpen.addEventListener('set.to.open', function(dict) {
		Ti.API.log("Event 'set.to.open': " + this.title);
		this.toOpen = dict.win;
	});

	//hack - setting this property ensures the window is "heavyweight" (associated with an Android activity)
	windowToOpen.navBarHidden = windowToOpen.navBarHidden || false;

	//This is the first window
	if (this.windowStack.length === 1) {
		if (Ti.Platform.osname === 'android') {
			windowToOpen.exitOnClose = true;
			windowToOpen.open();
		} else {
			// changed this from Ti.UI.iPhone.createNavigationGroup because it has been deprecated
			// since Ti 3.2.0
			this.navGroup = Ti.UI.iOS.createNavigationWindow({
				window : windowToOpen
			});
			this.navGroup.open();
		}
	}
	//All subsequent windows
	else {
		if (Ti.Platform.osname === 'android') {
			windowToOpen.open();
		} else {
			this.navGroup.openWindow(windowToOpen);
		}
	}
	Ti.API.log("End Open. Stack: " + this.windowStack.map(function(v) {return v.title;}));
}; // end of open function

// go back to the initial window of the NavigationController
NavigationController.prototype.home = function() {
	Ti.API.log("Home function.");
	if (this.windowStack.length > 1) {
		// setup chain reaction by setting up the flags on all the windows
		for (var i = this.windowStack.length - 1; i > 1; i--)
		{
			// set dependent window
			this.windowStack[i].fireEvent('set.to.close', {win: this.windowStack[i - 1]});
       	}
        // start chain reaction, close first window
		(this.navGroup) ? this.navGroup.closeWindow(this.windowStack[this.windowStack.length - 1]) : this.windowStack[this.windowStack.length - 1].close();
	}
	Ti.API.log("End Home. Stack: " + this.windowStack.map(function(v) {return v.title;}));
};

// close all the windows except for the 1st one, and then open a new window
NavigationController.prototype.openFromHome = function(windowToOpen) {
	Ti.API.log("openFromHome function.");
	if(this.windowStack.length == 1)
		this.open(windowToOpen);
	else
	{
		// delegate opening of the window to last window to close
		this.windowStack[1].fireEvent('set.to.open', {win: windowToOpen});
		this.home();
	}
	Ti.API.log("End openFromHome. Stack: " + this.windowStack.map(function(v) {return v.title;}));
};

module.exports = NavigationController;