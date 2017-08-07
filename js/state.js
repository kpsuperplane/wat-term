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
