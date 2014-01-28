var NavigationController = require('NavigationController'); // use the NavigationController library
var navController = new NavigationController();
Alloy.Globals.navcontroller = navController;

var testwin = Alloy.createController('TestWindow').getView();
Alloy.Globals.navcontroller.open(testwin);
