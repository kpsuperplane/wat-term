// Some variables
var state;

var defaultWindow =
'<div class="windowWrapper" style="height: $(SIZE)" id="$(FULLID)" tabindex="1">\
    <div style="height: 0px">&nbsp;</div>\
    <iframe class="terminalScriptUI" style="display:none"></iframe>\
    <div class="window" id="$(ID)">$(TERM)</div>\
</div>';
var defaultColumn = '<div class="column" id="$(ID)" style="width: $(SIZE)">$(CONTENT)</div>';
var defaultTerminal =
    '<div class="terminalWrapper">\
        <div class="hidden"><input type="text" class="textbox"></div>\
        <div class="terminal"></div>\
        <span class="prompt active"></span><span class="before"></span><span class="cursor blink">&nbsp;</span><span class="after"></span>\
    </div>';

$(document).ready(function() {
    state = new State();
    state.load(function () {
        buildWindows();
    });

    document.addEventListener('keydown', globalOnKeyDown, false);
});

function globalOnKeyDown(e) {
    var changed = false;
    var updated = false;
    var row = getRow(state.selectedWindow);
    var col = getCol(state.selectedWindow);

    if (e.shiftKey && e.keyCode === KEY_LEFT_ARROW) {
        state.shiftLeft();
        updated = true;
    }
    else if (e.shiftKey && e.keyCode === KEY_RIGHT_ARROW) {
        state.shiftRight();
        updated = true;
    }
    else if (e.shiftKey && e.keyCode === KEY_UP_ARROW) {
        if (row != 0) {
            state.getWindow(col, row - 1).height--;
            state.getWindow(col, row).height++;
        }
        else {
            state.getWindow(col, row + 1).height++;
            state.getWindow(col, row).height--;
        }
        updated = true;
    }
    else if (e.shiftKey && e.keyCode === KEY_DOWN_ARROW) {
        if (row != state.columns[col].windows.length - 1) {
            state.getWindow(col, row + 1).height--;
            state.getWindow(col, row).height++;
        }
        else {
            state.getWindow(col, row - 1).height++;
            state.getWindow(col, row).height--;
        }
        updated = true;
    }
    else if (e.ctrlKey && e.shiftKey && e.keyCode === KEY_I) {
        var collapse = state.getWindow(col, row).height / 2;
        state.getWindow(col, row).height = collapse;
        state.addWindow(col, row, new Window(collapse));
        changed = true;
    }
    else if (e.ctrlKey && e.shiftKey && e.keyCode === KEY_K) {
        var collapse = state.getWindow(col, row).height / 2;
        state.getWindow(col, row).height = collapse;
        state.addWindow(col, row + 1, new Window(collapse));
        changed = true;
    }
    else if (e.ctrlKey && e.shiftKey && e.keyCode === KEY_J) {
        var collapse = state.getColumn(col).width / 2;
        state.getColumm(col).width = collapse;
        state.addColumn(col, new Column(collapse));
        changed = true;
    }
    else if (e.ctrlKey && e.shiftKey && e.keyCode === KEY_L) {
        var collapse = state.getColumn(col).width / 2;
        state.getColumn(col).width = collapse;
        state.addColumn(col + 1, new Column(collapse));
        changed = true;
    }
    if (changed || updated) {
        buildWindows();
    }
}

function buildWindows() {
    var background = state.getEnv("background");

    // Set background color
    var color = background;
    if (background === "") {
        color = "#AAA";
    }
    else if (background.startsWith("http") || background.startsWith("https")) {
        color = "url('" + background + "')";
    }
    $("body").css("background", color);
    $("body").css("background-size", "cover");

    var content = "";
    for (var i = 0; i < state.columns.length; i++) {
        var newCol = defaultColumn.replace("$(ID)", "column" + i)
                                  .replace("$(SIZE)", state.getColumn(i).width + "%");

        var colContent = "";
        for (var j = 0; j < state.columns[i].windows.length; j++) {
            var newWin = defaultWindow.replace("$(ID)", "window" + i)
                                      .replace("$(FULLID)", i + DELIMITER + j)
                                      .replace("$(SIZE)", state.getWindow(i, j).height + "%")
                                      .replace("$(TERM)", defaultTerminal);
            colContent += newWin;
        }
        newCol = newCol.replace("$(CONTENT)", colContent);
        content += newCol;
    }
    $("body").html(content);

    bindEvents();
    $("#" + state.selectedWindow).children(".window").addClass("selected");
    restoreTerminalStates();
    updateTerminals();
}

function restoreTerminalStates() {
    var oldSelectedWindow = state.selectedWindow;
    for (var i = 0; i < state.columns.length; i++) {
        for (var j = 0; j < state.columns[i].windows.length; j++) {
            if (state.columns[i].windows[j].terminal.inProg) {
                state.selectedWindow = i + DELIMITER + j;
                processTerminalCommand(state.columns[i].windows[j].terminal.runningCommand, false);
            }
        }
    }
    state.selectedWindow = oldSelectedWindow;
}

function resetTerminals() {
    $(".windowWrapper").each(function(index, e) {
       var id = $(e).attr("id");
       state.getTerminal(id).inProg = false;
    });
    updateTerminals();
}

function bindEvents() {
    $(".windowWrapper").on('mousedown', function(e) {
        $(this).data('p0', { x: e.pageX, y: e.pageY });
    }).on('mouseup', function(e) {
        var p0 = $(this).data('p0'),
            p1 = { x: e.pageX, y: e.pageY },
            d = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));

        if (d < 4) {
            state.selectWindow($(this).attr("id"));
        }
    });
    $(".textbox").keydown(function(e) {
        if (!getCurrentTerminal().inProg) {
            var block = true;
            if (e.keyCode == KEY_ENTER && $(this).val()) {
                processTerminalCommand($(this).val(), true);
                $(this).val("");
                var window = $("#" + state.selectedWindow).find(".window");
                window.animate({ scrollTop: window.prop("scrollHeight") - window.height() }, 500);
            }
            else if (e.keyCode == KEY_DOWN_ARROW && getCurrentTerminal().historyIndex != getCurrentTerminal().history.length - 1) {
                getCurrentTerminal().historyIndex++;
                $(this).val(getCurrentTerminal().history[getCurrentTerminal().historyIndex]);
            }
            else if (e.keyCode == KEY_UP_ARROW && getCurrentTerminal().historyIndex != 0) {
                getCurrentTerminal().historyIndex--;
                $(this).val(getCurrentTerminal().history[getCurrentTerminal().historyIndex]);
            }
            else {
                block = false;
            }
            updateTextbox(this);
            return !block;
        }
    });
    $(".textbox").keypress(function(e) {
        updateTextbox(this);
    });
    $(".textbox").keyup(function(e) {
        updateTextbox(this);
    });
}

function updateTextbox(sender) {
    var cursorPos = $(sender)[0].selectionStart;
    var string = $(sender).val();
    $(sender).parent().parent().find(".before").text(string.substring(0, cursorPos));

    if (cursorPos < string.length) {
        $(sender).parent().parent().find(".cursor").text(string.charAt(cursorPos));

        $(sender).parent().parent().find(".after").text(string.substring(cursorPos + 1, string.length));
    }
    else {
        $(sender).parent().parent().find(".cursor").html("&nbsp;");

        $(sender).parent().parent().find(".after").html("");
    }
    getCurrentTerminal().history[getCurrentTerminal().historyIndex] = string;
}

function getCurrentTerminal() {
    return state.getTerminal(state.selectedWindow);
}

function updateTerminals() {
    $(".windowWrapper").each(function(i, e) {

        var id = $(e).attr("id");
        $(e).find(".terminal").html(state.getTerminal(id).output);
        $(e).find(".window").animate({
            scrollTop: $(e).find(".window")[0].scrollHeight
        }, 500);
        $(e).find(".prompt.active").text(makePrompt(state.getTerminal(id)));
        if (state.getTerminal(id).inProg) {
            $(e).find(".prompt.active").hide();
        }
        else {
            $(e).find(".prompt.active").show();
        }
    });

    state.save();
}

function makePrompt(terminal) {
    var prompt = state.getEnv("prompt");
    prompt = prompt.replace("%w", terminal.workingDirectory);
    return prompt;
}

function directoryExist(directory) {
    // Cast to boolean
    return !!getDirectory(directory);
}

function getFile(path) {
    var end = path.lastIndexOf("/");
    if (end === -1) return false;

    var parts = path.split("/");
    var filename = parts[parts.length - 1];
    var containingDirRes = getDirectory(path.substring(0, end));
    if (containingDirRes === false) return false;

    var containingPath = containingDirRes[1];
    var containingDir = containingDirRes[0];
    for (var j = 0; j < containingDir.data.length; j++) {
        if (containingDir.data[j].type === FILE_TYPE &&
            containingDir.data[j].name === filename) {
            return [containingDir.data[j], containingPath + "/" + filename];
        }
    }
    return false;
}

function getDirectory(directory) {
    var parts = directory.split("/");
    var dirStack = [];
    var curDir = state.wfs;
    dirStack.push(curDir);
    for (var i = 1; i < parts.length; i++) {
        if (parts === "" || parts === ".") continue;
        if (parts[i] === "..") {
            curDir = dirStack[dirStack.length - 1];
            if (dirStack.length != 1) {
                dirStack.pop();
            }
            continue;
        }
        var found = -1;
        for (var j = 0; j < curDir.data.length; j++) {
            // Found it
            if (curDir.data[j].name === parts[i] && curDir.data[j].type === DIR_TYPE) {
                found = j;
                break;
            }
        }
        if (found != -1) {
            dirStack.push(curDir.data[j])
        }
        else {
            return false;
        }
        curDir = dirStack[dirStack.length - 1];
    }
    var path = "";
    for (var i = 0; i < dirStack.length; i++) {
        if (i != 0) path += "/";
        path += dirStack[i].name;
    }
    return [curDir, path];
}

function errorString(command, message) {
    // TODO: what is happening here
    return "<p>wsh: " + command + ": " + message + "</p>";
    getCurrentTerminal().runningCommand = "";
    getCurrentTerminal().inProg = false;
    console.log(getCurrentTerminal());
}

function getAlias(alias) {
    for (var i = 0; i < state.wsh.aliases.length; i++) {
        console.log(state.wsh.aliases[i].alias + "," + alias + ", " + (alias === state.wsh.aliases[i].alias));
        if (alias === state.wsh.aliases[i].alias) {
            return state.wsh.aliases[i];
        }
    }
    return false;
}

function processTerminalCommand(command, logInTerminal) {
    // In case user changes during run
    if (logInTerminal) {
        if (getCurrentTerminal().historyIndex == getCurrentTerminal().history.length - 1) {
            getCurrentTerminal().historyIndex++;
            getCurrentTerminal().history.push("");
        }
        else {
            getCurrentTerminal().historyIndex = getCurrentTerminal().history.length;
            getCurrentTerminal().history.push(command);
        }
        getCurrentTerminal().output += '<p><span class="prompt">' + makePrompt(getCurrentTerminal()) + '</span> ' + command + "</p>";
    }
    var workingDirectoryPath = getCurrentTerminal().workingDirectory;
    var workingDirectory = getDirectory(workingDirectoryPath)[0];
    if (workingDirectory === false) {
        getCurrentTerminal().output += errorString("proc", "Working directory not found. Resetting.");
        getCurrentTerminal().workingDirectory = "~";
        updateTerminals();
        return;
    }
    var parts = splitSpace(command);
    if (parts[0] != "unbind" && parts[0] != "bind") {
        // These dont get alias replacement
        for (var i = 0; i < state.wsh.aliases.length; i++) {
            command = command.replace(state.wsh.aliases[i].alias, state.wsh.aliases[i].command);
        }
        parts = splitSpace(command);
    }
    var runInWindow = state.selectedWindow;
    getCurrentTerminal().runningCommand = command;
    getCurrentTerminal().inProg = false;
    switch (parts[0]) {
        // Built in System Commands
        case "env":
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
            break;
        case "cd":
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
            break;
        case "mkdir":
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
            break;
        case "ls":
            var lsOutput = "<p>";
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
            getCurrentTerminal().output += lsOutput + "</p>";
            break;
        case "cat":
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
            break;
        case "aliases":
            getCurrentTerminal().output += "<p>Bound aliases: </p>";
            for (var i = 0; i < state.wsh.aliases.length; i++) {
                getCurrentTerminal().output += "<p>" + state.wsh.aliases[i].alias + " -> "
                    + state.wsh.aliases[i].command + "</p>";
            }
            break;
        case "bind":
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
            break;
        case "unbind":
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
            break;
        case "clear":
            getCurrentTerminal().output = "";
            getCurrentTerminal().history = [""];
            getCurrentTerminal().historyIndex = 0;
            break;
        case "reset":
            state = new State();
            buildWindows();
            break;
        case "kill":
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
            break;
        case "edit":
            if (parts.length != 2) {
                 getCurrentTerminal().output += errorString(parts[0], "No file provided");
            }
            else {
                var path = workingDirectoryPath + "/" + parts[1];
                var navResult = getFile(path);
                if (navResult === false) {
                    // create file
                    workingDirectory.data.push(createFile(parts[1]));
                    console.log("madefile");
                }
                var result = window.prompt("Editing file: " + path, navResult === false ? "" : navResult[0].data);
                console.log("promtped");
                if (result != null) {
                    navResult = getFile(workingDirectoryPath + "/" + parts[1]);
                    navResult[0].data = result;
                }
            }
            break;
        case "man":
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
            break;
        case "":
            break;
        default:
            // Attempt to look online for script
            var path = WAT_TERM_CONTENT_URL + parts[0] + "/index.html";
            $.ajax({
                url: path,
                async: false,
                success: function(data) {
                    evaluateScript(
                        path, state.wfs, getCurrentTerminal(),
                        $("#" + state.selectedWindow).find(".terminalScriptUI")[0],
                        parts.slice(1, parts.length)
                    );
                }
            }).fail(function() {
                getCurrentTerminal().output += errorString(command, "command not found");
            });
            break;
    }

    updateTerminals();
}



// Forks the Process over to an external script.
// script:      script to be evaled
// wfs:         reference to the filesystem
// params:      list of parameters passed into script
// terminal:    reference to the terminal
function evaluateScript(script, wfs, terminal, frame, params) {
    // Functions accessible by script
    terminal.inProg = true;

    $(frame).show();
    $("#" + state.selectedWindow).find(".window").hide();
    var cacheParamValue = (new Date()).getTime();
    script = script + "?cache=" + cacheParamValue + "&id=" + state.selectedWindow +
             "&env=" + encodeURIComponent(JSON.stringify(state.wsh.env)) + "&params=" + params;
    $(frame).attr("src", script);
    updateTerminals();
}

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    var parts = event.data.split("|");
    if (parts[0] === "done") {
        var id = parts[1];
        killTerminal(id);
    }
    else if (parts[0] === "env") {
        setEnv(parts[1], parts[2]);
    }
}

function killTerminal(id) {
    $("#" + id).find(".terminalScriptUI").hide();
    $("#" + id).find(".window").show();
    state.getTerminal(id).inProg = false;
    selectedWindow = id;
    updateTerminals();
}
