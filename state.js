class State {
    constructor () {
        this.columns = [new Column(100)];
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
        this.selectedWindow = "0" + DELIMITER + "0";
        this.selectWindow(this.selectedWindow);
    }

    load (callback) {
        var defaultStateObject = {};
        defaultStateObject[STATE_KEY] = {
            columns: [new Column(100)],
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
            self.username = newState.username;
            self.columns = newState.columns;
            self.wfs = newState.wfs;
            self.wsh = newState.wsh;
            callback();
        });
    }

    save () {
        var savedObject = {};
        savedObject[STATE_KEY] = this;
        chrome.storage.local.set(savedObject);
    }

    getTerminal(id) {
        return this.columns[getCol(id)].windows[getRow(id)].terminal;
    }

    getWindow(col, row) {
        return this.columns[col].windows[row];
    }

    getColumn (col) {
        return this.columns[col];
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
        $("#" + this.selectedWindow).find(".window").removeClass("selected");
        this.selectedWindow = id;
        $("#" + this.selectedWindow).find(".window").addClass("selected");
        $("#" + this.selectedWindow).find(".textbox").focus();
    }

    shiftLeft() {
        var row = getRow(this.selectedWindow);
        var col = getCol(this.selectedWindow);
        if (col != 0) {
            this.columns[col - 1].width--;
            this.columns[col].width++;
        }
        else {
            this.columns[col + 1].width++;
            this.columns[col].width--;
        }
    }

    shiftRight() {
        var row = getRow(this.selectedWindow);
        var col = getCol(this.selectedWindow);
        if (col != this.columns.length - 1) {
            this.columns[col + 1].width--;
            this.columns[col].width++;
        }
        else {
            this.columns[col - 1].width++;
            this.columns[col].width--;
        }
    }
}

class Column {
    constructor (w) {
        this.width = w;
        this.windows = [new Window(100)];
    }
}

class Window {
    constructor (h) {
        this.height = h;
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
