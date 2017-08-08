class State {
    constructor () {
        this.windows = [new Window(0, 0, 100, 100)];
        this.wfs = createWelcomeDirectory();
        this.wsh = {
            // environmental variables
            env: [
                {
                    key: "background",
                    value: ""
                },
                {
                    key: "prompt",
                    value: "%w $ "
                }
            ],
            // alias mappings
            aliases: [],
        };
        this.selectedWindow = this.windows[0].id;
        this.selectWindow(this.selectedWindow);
    }

    load (callback) {
        var defaultStateObject = {};
        defaultStateObject[STATE_KEY] = {
            windows: [new Window(0, 0, 100, 100)],
            wfs: createWelcomeDirectory(),
            wsh: {
                // environmental variables
                env: [{
                    key: "background",
                    value: ""
                },{
                    key: "prompt",
                    value: "%w $ "
                }],
                // alias mappings
                aliases: [],
        }};
        var self = this;
        chrome.storage.local.get(defaultStateObject, function(items) {
            var newState = items[STATE_KEY];
            console.log("Retrieved Saved: ");
            console.log(newState);
            self.username = newState.username;
            self.windows = newState.windows;
            self.wfs = newState.wfs;
            self.wsh = newState.wsh;
            callback();
        });
    }

    save() {
        console.log("Saved State");
        var savedObject = {};
        savedObject[STATE_KEY] = this;
        chrome.storage.local.set(savedObject);
    }

    getTerminal(id) {
        console.log("GetTerminal: " + id);
        return this.getWindow(id).terminal;
    }

    getWindowIndexFromId(id) {
        for (var i = 0; i < this.windows.length; i++) {
            if (this.windows[i].id == id) {
                return i;
            }
        }
        return 0;
    }

    getWindow(id) {
        return this.windows[this.getWindowIndexFromId(id)];
    }

    addWindow(col, row, newWindow) {
        this.columns[col].windows.splice(row, 0, newWindow);
    }

    addColumn(col, newColumn) {
        this.columns.splice(col, 0, newColumn);
    }

    getEnv(key) {
        for (var i = 0; i < this.wsh.env.length; i++) {
            if (this.wsh.env[i].key === key) {
                return this.wsh.env[i].value;
            }
        }
        return "";
    }

    setEnv(key, value) {
        for (var i = 0; i < this.wsh.env.length; i++) {
            if (this.wsh.env[i].key === key) {
                this.wsh.env[i].value = value;
                this.save();
                return;
            }
        }
        this.wsh.env.push({ key: key, value: value });
        this.save();
    }

    selectWindow(id) {
        console.log("Selected Window " + id);
        $("#" + this.selectedWindow).find(".window").removeClass("selected");
        this.selectedWindow = id;
        $("#" + this.selectedWindow).find(".window").addClass("selected");
        $("#" + this.selectedWindow).find(".textbox").focus();
    }

    horizontalSplit(index) {
        var h = this.windows[index].height;
        var ho = Math.floor(h / 2);
        var hn = Math.ceil(h / 2);
        this.windows[index].height = ho;
        this.windows.push(new Window(this.windows[index].x, 
            this.windows[index].y + ho, this.windows[index].width, hn));
        buildWindows();
    }

    verticalSplit(index) {
        var w = this.windows[index].width;
        var wo = Math.floor(w / 2);
        var wn = Math.ceil(w / 2);
        this.windows[index].width = wo;
        this.windows.push(new Window(this.windows[index].x + wn, 
            this.windows[index].y, wn, this.windows[index].height));
        buildWindows();
    }

    // the following commands either returns a list of windows that are exact
    //   borders of the given index, or false if there are none

    borderingComp(index, borderingComp, boundaryComp1, boundaryComp2) {
        var borderingWindows = [];
        var a = this.windows[index];
        for (var i = 0; i < this.windows.length; i++) {
            if (i != index) {
                var b = this.windows[i];
                if (borderingComp(a, b)) {
                    // Bordering
                    if (boundaryComp1(a, b)) {
                        borderingWindows.push(b);
                    }
                    else if (boundaryComp2(a, b)) {
                        continue;
                    }
                    else {
                        // Borders on edge but exceeds limit.
                        return false;
                    }
                }
            }
        }
        if (borderingWindows.length == 0) {
            return false;
        }
        return borderingWindows;
    }

    getBorderingLeft(index) {
        return this.borderingComp(index, 
            function(a, b) { return b.x + b.width == a.x; },
            function(a, b) { return b.y >= a.y && b.y + b.height <= a.y + a.height; },
            function(a, b) { return b.y >= a.y + a.height || b.y + b.height <= a.y; });
    }
    
    getBorderingRight(index) {
        return this.borderingComp(index, 
            function(a, b) { return b.x == a.x + a.width; },
            function(a, b) { return b.y >= a.y && b.y + b.height <= a.y + a.height; },
            function(a, b) { return b.y >= a.y + a.height || b.y + b.height <= a.y; });
    }

    getBorderingTop(index) {
        return this.borderingComp(index, 
            function(a, b) { return b.y + b.height == a.y; },
            function(a, b) { return b.x >= a.x && b.x + b.width <= a.x + a.width; },
            function(a, b) { return b.x >= a.x + a.width || b.x + b.width <= a.x; });
    }

    getBorderingBottom(index) {
        return this.borderingComp(index, 
            function(a, b) { return b.y == a.y + a.height; },
            function(a, b) { return b.x >= a.x && b.x + b.width <= a.x + a.width; },
            function(a, b) { return b.x >= a.x + a.width || b.x + b.width <= a.x; });
    }

    // edge is one of left, right, top, or bottom
    // c is 1 for +, -1 for -
    getChangeMatrix(edge, c) { 
        // c is current, r is rest, d is delta
        // returns [dcx, dcy, dcw, dch, drx, dry, drw, drh]
        if (edge == "left") {
            return [-c, 0, c, 0, 0, 0, -c, 0];
        }
        else if (edge == "right") {
            return [0, 0, c, 0, c, 0, -c, 0];
        }
        else if (edge == "top") {
            return [0, -c, 0, c, 0, 0, 0, -c];
        }
        else {
            return [0, 0, 0, c, 0, c, 0, -c];
        }
    }
}

class Window {
    constructor (x, y, w, h) {
        this.width = w;
        this.x = x;
        this.y = y;
        this.height = h;
        this.id = new Date().getTime();
        this.terminal = new Terminal();
    }
}

class Terminal {
    constructor () {
        this.history = [""];
        this.historyIndex = 0;
        this.inProg = false;
        this.output = "WatTerm 1.0\n";
        this.runningCommand = "";
        this.workingDirectory = "~";
    }
}
