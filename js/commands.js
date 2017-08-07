var Commands = {
    "env": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length === 1) {
                getCurrentTerminal().output += "<p>Environment Variables</p>";
                 for (var i = 0; i < state.wsh.env.length; i++) {
                     getCurrentTerminal().output +=
                        "<p>" + state.wsh.env[i].key + ": " + state.wsh.env[i].value + "</p>";
                }
            }
            else if (parts.length === 2) {
                getCurrentTerminal().output += "<p>" + parts[1] + ": " + state.getEnv(parts[1]) + "</p>";
            }
            else {
                state.setEnv(parts[1], parts.slice(2, parts.length).join(" "));
                getCurrentTerminal().output += "<p>Set variable " + parts[1] + ".</p>";
            }
        }
    },
    "cd": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (!parts[1]) {
                getCurrentTerminal().output += errorString(parts[0], "No directory provided");
            }
            else {
                var navResult = getDirectory(workingDirectoryPath + "/" + parts[1]);
                if (navResult) {
                    getCurrentTerminal().workingDirectory = navResult[1];
                }
                else {
                    getCurrentTerminal().output += errorString(parts[0], parts[1] + ": No such directory");
                }
            }
        }
    },
    "mkdir": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (!parts[1]) {
                getCurrentTerminal().output += errorString(parts[0], "No directory provided");
            }
            else {
                if (directoryExist(workingDirectoryPath + "/" + parts[1])) {
                    getCurrentTerminal().output += errorString(parts[0], parts[1] + ": Directory already exists");
                }
                else {
                    workingDirectory.data.push(createDirectory(parts[1]));
                }
            }
        }
    },
    "ls": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            var lsOutput = "";
            if (workingDirectory.data.length === 0) {
                lsOutput += "Directory is empty";
            }
            else {
                lsOutput += "Directory listing for " + workingDirectoryPath + "<br>";
            }
            for (var i = 0; i < workingDirectory.data.length; i++) {
                var prefix = "FILE    ";
                if (workingDirectory.data[i].type === DIR_TYPE) {
                    prefix = "DIR     ";
                }
                lsOutput += "<p>" + prefix + " " + workingDirectory.data[i].name + "</p>";
            }
            getCurrentTerminal().output += "<p>" + lsOutput + "</p>";
        }
    },
    "cat": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (!parts[1]) {
                getCurrentTerminal().output += errorString(parts[0], "No file provided");
            }
            else {
                var navResult = getFile(workingDirectoryPath + "/" + parts[1]);
                if (navResult === false) {
                    getCurrentTerminal().output += errorString(parts[0], "File not found");
                }
                else {
                    getCurrentTerminal().output += "<p>" + navResult[0].data + "</p>";
                }
            }
        }
    },
    "aliases": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            getCurrentTerminal().output += "<p>Bound aliases: </p>";
            for (var i = 0; i < state.wsh.aliases.length; i++) {
                getCurrentTerminal().output += "<p>" + state.wsh.aliases[i].alias + " -> "
                    + state.wsh.aliases[i].command + "</p>";
            }
        }
    },
    "bind": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length < 3) {
                getCurrentTerminal().output += errorString(parts[0], "Need at least two parameters");
            }
            else {
                var result = getAlias(parts[1]);
                var command = parts.slice(2, parts.length).join(" ");
                if (result) {
                    getCurrentTerminal().output += errorString(parts[0],
                        "Previous alias already exists, will be overwritten! <br>Previous Alias is " + result.command);
                    result.command = command;
                }
                else {
                    state.wsh.aliases.push(createAlias(parts[1], command));
                }
            }
        }
    },
    "unbind": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (!parts[1]) {
                getCurrentTerminal().output += errorString(parts[0], "Need an alias to unbind");
            }
            else {
                var result = getAlias(parts[1]);
                if (result === false) {
                    getCurrentTerminal().output += errorString(parts[0], "Alias not found");
                }
                else {
                    state.wsh.aliases.splice(state.wsh.aliases.indexOf(result), 1);
                }
            }
        }
    },
    "clear": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            getCurrentTerminal().output = "";
            getCurrentTerminal().history = [""];
            getCurrentTerminal().historyIndex = 0;
        }
    },
    "reset": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            state = new State();
            buildWindows();
        }
    },
    "kill": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length != 2) {
                 getCurrentTerminal().output += errorString(parts[0], "No parameters provided");
            }
            else {
                var terminal = state.getTerminal(parts[1]);
                if (terminal != null) {
                    getCurrentTerminal().output += "<p>Killed terminal</p>";
                    killTerminal(parts[1]);
                }
                else {
                    getCurrentTerminal().output += errorString(parts[0], "Invalid id");
                }
            }
        }
    },
    "edit": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length != 2) {
                 getCurrentTerminal().output += errorString(parts[0], "No file provided");
            }
            else {
                var path = workingDirectoryPath + "/" + parts[1];
                var navResult = getFile(path);
                if (navResult === false) {
                    // create file
                    workingDirectory.data.push(createFile(parts[1]));
                }
                var result = window.prompt("Editing file: " + path, navResult === false ? "" : navResult[0].data);
                if (result != null) {
                    navResult = getFile(workingDirectoryPath + "/" + parts[1]);
                    navResult[0].data = result;
                }
            }
        }
    },
    "man": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length != 2) {
                 getCurrentTerminal().output += errorString(parts[0], "No command provided");
            }
            else {
                var path = WAT_TERM_CONTENT_URL + parts[1] + "/man.html";
                $.ajax({
                    url: path,
                    async: false,
                    success: function(data) {
                        getCurrentTerminal().output += data;
                    }
                }).fail(function() {
                    getCurrentTerminal().output += errorString(parts[0], "Could not load man page for " + parts[1]);
                });
            }
        }
    },
    "window": {
        run: function(parts, workingDirectory, workingDirectoryPath) {
            if (parts.length < 2) {
                getCurrentTerminal().output += errorString(parts[0], "Expected more parameters");
            }
            else if (parts[1] == "vs") {
                state.verticalSplit(state.getWindowIndexFromId(state.selectedWindow));
            }
            else if (parts[1] == "hs") {
                state.horizontalSplit(state.getWindowIndexFromId(state.selectedWindow));
            }
            else if (parts[1] == "list") {
                getCurrentTerminal().output += "<p><b>Windows: </b></p>";
                for (var i = 0; i < state.windows.length; i++) {
                    var window = state.windows[i];
                    getCurrentTerminal().output += "<p>" + i + " (" + window.id + "): " 
                        + window.x + ", " +  window.y + ", " + window.width + ", " + window.height + "</p>";
                }
            }
        }
    }
}
