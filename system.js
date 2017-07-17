var state;
var STATE_KEY = "state";
var KEY_LEFT_ARROW = 37;
var KEY_UP_ARROW = 38;
var KEY_RIGHT_ARROW = 39;
var KEY_DOWN_ARROW = 40;
var KEY_I = 73;
var KEY_J = 74;
var KEY_K = 75;
var KEY_L = 76;
var KEY_ENTER = 13;
var DIR_TYPE = "dir";
var FILE_TYPE = "file";
var DELIMITER = "-";
var KEY_C = 67;

var windowWidth;
var windowHeight;
var selectedWindow = "0" + DELIMITER + "0";

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

function createDefaultState() {
    return { username: "Untitled", 
             columns: [createColumn(100)],
             wfs: createWelcomeDirectory(),
             wsh: { 
                 env: [
                     {  key: "background", 
                        value: "" }
                 ], // environmental variables
                 aliases: [],// alias mappings
             }};
}

function createAlias(alias, command) {
    return { alias: alias, command: command };
}

function createWindow(h) {
    return { height: h, 
             terminal: createTerminal() };
}

function createTerminal() {
    return { prompt: "felixguo@walter %w $ ", 
             output: "WatTerm 1.0\n", 
             inProg: false, 
             history: "", 
             runningCommand: "",
             workingDirectory: "~" };
}

function createWelcomeDirectory() {
    var dir = createDirectory("~");
    dir.data.push({ type: FILE_TYPE,
             name: "Welcome",
             data: "Welcome to WatTerm! Here is some information about some stuff!\n" });
    dir.data.push({ type: DIR_TYPE,
             name: "scripts",
             data: [{ type: FILE_TYPE,
             name: "clock",
             data: "http://wat-ter.ml/clock/" }] });
    return dir;
}

function createColumn(w) {
    return { width: w, windows: [createWindow(100)] };
}

function createDirectory(n) {
    return { type: DIR_TYPE,
             name: n,
             data: [] };
}

$(document).ready(function() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    var defaultStateObject = {};
    defaultStateObject[STATE_KEY] = createDefaultState();
    console.log(chrome.storage.local);
    chrome.storage.local.get(defaultStateObject, 
    function(items) {
        console.log(items);
        state = items[STATE_KEY];
        buildWindows();
        selectWindow(selectedWindow);
        restoreTerminalStates();
    });
    document.addEventListener('keydown', globalOnKeyDown, false);
});

function globalOnKeyDown(e) {
    var changed = false;
    var updated = false;
    if (event.shiftKey && e.keyCode == KEY_LEFT_ARROW) {
        var col = getCol(selectedWindow);
        if (col != 0) {
            state.columns[col - 1].width--;
            state.columns[col].width++;
        }
        else {
            state.columns[col + 1].width++;
            state.columns[col].width--;
        }
        updated = true;
    }
    else if (event.shiftKey && e.keyCode == KEY_RIGHT_ARROW) {
        var col = getCol(selectedWindow);
        if (col != state.columns.length - 1) {
            state.columns[col + 1].width--;
            state.columns[col].width++;
        }
        else {
            state.columns[col - 1].width++;
            state.columns[col].width--;
        }
        updated = true;
    }
    else if (event.shiftKey && e.keyCode == KEY_UP_ARROW) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        if (row != 0) {
            state.columns[col].windows[row - 1].height--;
            state.columns[col].windows[row].height++;
        }
        else {
            state.columns[col].windows[row + 1].height++;
            state.columns[col].windows[row].height--;
        }
        updated = true;
    }
    else if (event.shiftKey && e.keyCode == KEY_DOWN_ARROW) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        if (row != state.columns[col].windows.length - 1) {
            state.columns[col].windows[row + 1].height--;
            state.columns[col].windows[row].height++;
        }
        else {
            state.columns[col].windows[row - 1].height++;
            state.columns[col].windows[row].height--;
        }
        updated = true;
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_I) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].windows[row].height / 2;
        state.columns[col].windows[row].height = collapse;
        state.columns[col].windows.splice(row, 0, createWindow(collapse));
        changed = true;
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_K) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].windows[row].height / 2;
        state.columns[col].windows[row].height = collapse;
        state.columns[col].windows.splice(row + 1, 0, createWindow(collapse));
        changed = true;
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_J) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].width / 2;
        state.columns[col].width = collapse;
        state.columns.splice(col, 0, createColumn(collapse));
        changed = true;
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_L) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].width / 2;
        state.columns[col].width = collapse;
        state.columns.splice(col + 1, 0, createColumn(collapse));
        changed = true;
    }
    if (changed) {
        buildWindows();
    }
    if (updated) {
        updateWindows();
    }
}

function getCol(a) {
    return parseInt(a.split(DELIMITER)[0]);
}

function getRow(a) {
    return parseInt(a.split(DELIMITER)[1]);
}

function restoreTerminalStates() {
    for (var i = 0; i < state.columns.length; i++) {
        for (var j = 0; j < state.columns[i].windows.length; j++) { 
            if (state.columns[i].windows[j].terminal.inProg) {
                selectedWindow = i + DELIMITER + j;
                processTerminalCommand(state.columns[i].windows[j].terminal.runningCommand);
            }
        }
    }
}

function selectWindow(newID) {
    $("#" + selectedWindow).find(".window").removeClass("selected");
    selectedWindow = newID;
    $("#" + selectedWindow).find(".window").addClass("selected");
    $("#" + selectedWindow).find(".textbox").focus();
    setTimeout(function () { $("#" + selectedWindow).find(".textbox").focus(); }, 1);
}

function resetTerminals() {
    $(".windowWrapper").each(function(index, e) {
       var id = $(e).attr("id");
       getTerminalFromId(id).inProg = false;
    });
    updateTerminals();
}

function bindEvents() {
    $(".windowWrapper").click(function() {
       selectWindow($(this).attr("id"));
    });

    $(".textbox").keydown(function(e) {
        if (!getCurrentTerminal().inProg) {
            if (e.keyCode == KEY_ENTER && $(this).val()) {
                processTerminalCommand($(this).val());
                $(this).val("");
                var window = $("#" + selectedWindow).find(".window");
                window.animate({ scrollTop: window.prop("scrollHeight") - window.height() }, 500);
            }
            updateTextbox(this);
        }
        else {
            return false;
        }
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
}
function getCurrentTerminal() {
    return getTerminalFromId(selectedWindow);
}

function getTerminalFromId(id) {
    return state.columns[getCol(id)].windows[getRow(id)].terminal;
}

function saveState() {
    var savedObject = {};
    savedObject[STATE_KEY] = state;
    chrome.storage.local.set(savedObject);
}

function updateWindows() {
    var background = getEnv("background");
    var color = background;
    if (background == "") {
        color = "#AAA";
    }
    else if (background.startsWith("http") || background.startsWith("https")) {
        color = "url('" + background + "')";
    }
    console.log(color);
    $("body").css("background", color);
    $("body").css("background-size", "cover");
    for (var i = 0; i < state.columns.length; i++) {
        $("#column" + i).width(state.columns[i].width + "%");
        for (var j = 0; j < state.columns[i].windows.length; j++) {
            $("#" + i + DELIMITER + j).height(state.columns[i].windows[j].height + "%");
        }
    }
    updateTerminals();
}

function buildWindows() {
    var content = "";
    for (var i = 0; i < state.columns.length; i++) {
        var newCol = defaultColumn.replace("$(ID)", "column" + i);
        newCol = newCol.replace("$(SIZE)", state.columns[i].width + "%");
        var colContent = "";
        for (var j = 0; j < state.columns[i].windows.length; j++) {
            var newWin = defaultWindow.replace("$(ID)", "window" + i);
            newWin = newWin.replace("$(FULLID)", i + DELIMITER + j);
            newWin = newWin.replace("$(SIZE)", state.columns[i].windows[j].height + "%");
            newWin = newWin.replace("$(TERM)", defaultTerminal);
            colContent += newWin;
        }
        newCol = newCol.replace("$(CONTENT)", colContent);
        content += newCol;
    }
    $("body").html(content);
    bindEvents();
    $("#" + selectedWindow).children(".window").addClass("selected");
    updateWindows();
}

function updateTerminals() {
    $(".windowWrapper").each(function(i, e) {
        
        var id = $(e).attr("id");
        $(e).find(".terminal").html(getTerminalFromId(id).output);
        $(e).find(".window").animate({
            scrollTop: $(e).find(".window")[0].scrollHeight
        }, 500);
        $(e).find(".prompt.active").text(makePrompt(getTerminalFromId(id)));
        if (getTerminalFromId(id).inProg) {
            $(e).find(".prompt.active").hide();
        }
        else {
            $(e).find(".prompt.active").show();
        }
    });

    saveState();
}

function makePrompt(terminal) {
    var prompt = terminal.prompt;
    prompt = prompt.replace("%w", terminal.workingDirectory);
    return prompt;
}

function directoryExist(directory) {
    if (getDirectory(directory) == false) {
        return false;
    }
    else {
        return true;
    }
}

function getFile(path) {
    var end = path.lastIndexOf("/");
    var parts = path.split("/");
    var filename = parts[parts.length - 1];
    if (end == -1) return false;
    var containingDirRes = getDirectory(path.substring(0, end));
    if (containingDirRes == false) return false;
    var containingPath = containingDirRes[1];
    var containingDir = containingDirRes[0]; 
    for (var j = 0; j < containingDir.data.length; j++) {
        if (containingDir.data[j].type == FILE_TYPE &&
            containingDir.data[j].name == filename) {
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
        if (parts == "" || parts == ".") continue;
        if (parts[i] == "..") {
            curDir = dirStack[dirStack.length - 1];
            dirStack.pop();
            continue;
        }
        var found = -1;
        for (var j = 0; j < curDir.data.length; j++) {
            // Found it
            if (curDir.data[j].name == parts[i] && curDir.data[j].type == DIR_TYPE) {
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
    return "<p>wsh: " + command + ": " + message + "</p>";
}

function getAlias(alias) {
    for (var i = 0; i < state.wsh.aliases.length; i++) {
        console.log(state.wsh.aliases[i].alias + "," + alias + ", " + (alias == state.wsh.aliases[i].alias));
        if (alias == state.wsh.aliases[i].alias) {
            return state.wsh.aliases[i];
        }
    }
    return false;
}

function processTerminalCommand(command) {
    // In case user changes during run
    getCurrentTerminal().output += '<p><span class="prompt">' + makePrompt(getCurrentTerminal()) + '</span> ' + command + "</p>";
    var workingDirectoryPath = getCurrentTerminal().workingDirectory;
    var workingDirectory = getDirectory(workingDirectoryPath)[0];
    if (workingDirectory == false) {
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
    var runInWindow = selectedWindow;
    console.log(parts);
    switch (parts[0]) {
        // Built in System Commands
        case "env":
            if (parts.length == 1) {
                getCurrentTerminal().output += "<p>Environment Variables</p>";
                 for (var i = 0; i < state.wsh.env.length; i++) {
                     getCurrentTerminal().output += 
                        "<p>" + state.wsh.env[i].key + ": " + state.wsh.env[i].value + "</p>";
                }
            }
            else if (parts.length == 2) {
                getCurrentTerminal().output += "<p>" + parts[1] + ": " + getEnv(parts[1]) + "</p>";
            }
            else {
                setEnv(parts[1], parts.slice(2, parts.length).join(" "));
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
            if (workingDirectory.data.length == 0) {
                lsOutput += "Directory is empty";
            } 
            else {
                lsOutput += "Directory listing for " + workingDirectoryPath + "<br>";
            }
            for (var i = 0; i < workingDirectory.data.length; i++) {
                var prefix = "FILE    ";
                if (workingDirectory.data[i].type == DIR_TYPE) {
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
                if (navResult == false) {
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
                if (result == false) {
                    getCurrentTerminal().output += errorString(parts[0], "Alias not found");
                }   
                else {
                    state.wsh.aliases.splice(state.wsh.aliases.indexOf(result), 1);
                }
            }
            break;
        case "clear":
            getCurrentTerminal().output = "";
            break;
        case "script":
            if (!parts[1]) {
                var navResult = getDirectory("~/scripts");
                if (navResult == false || navResult[0].data.length == 0) {
                    getCurrentTerminal().output += "No Scripts Installed";
                }
                else {
                    var first = true;
                    getCurrentTerminal().output += "<p>Available Scripts: <br>";
                    for (var i = 0; i < navResult[0].data.length; i++) {
                        if (navResult[0].data[i].type == FILE_TYPE) {
                            if (!first) {
                                getCurrentTerminal().output = "<br>";
                            }
                            else {
                                first = false;
                            }
                            getCurrentTerminal().output += navResult[0].data[i].name;
                        }
                    }
                    getCurrentTerminal().output += "</p>";
                }
            }
            else {
                var navResult = getFile("~/scripts/" + parts[1]);
                if (navResult == false) {
                    getCurrentTerminal().output += errorString(parts[0], "Script not found");
                }
                else {
                    // Execute Script here!
                    setTimeout(function() {
                        evaluateScript(navResult[0].data, state.wfs, parts.slice(2, parts.length), 
                        getCurrentTerminal(), $("#" + selectedWindow).find(".terminalScriptUI")[0]);
                    },0);
                }
            }
            break;
        case "reset":
            state = createDefaultState();
            buildWindows();
            break;
        default:
            getCurrentTerminal().output += errorString(command, "command not found");
            break;
    }
    getCurrentTerminal().runningCommand = command;
    updateTerminals();
}

function splitSpace(string) {
    var parts = string.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g);
    for (var i = 0; i < parts.length; i++) {
        parts[i] = parts[i].replace(/"/g, "");
        parts[i] = parts[i].replace(/'/g, "");
    }
    return parts;
}

// Forks the Process over to an external script.
// script:      script to be evaled
// wfs:         reference to the filesystem
// params:      list of parameters passed into script
// terminal:    reference to the terminal
var lastFrame;
function evaluateScript(script, wfs, params, terminal, frame) {
    // Functions accessible by script
    terminal.inProg = true;

    $(frame).show();
    $("#" + selectedWindow).find(".window").hide();
    var cacheParamValue = (new Date()).getTime();
    script = script + "?cache=" + cacheParamValue;
    $(frame).attr("src", script);
    lastFrame = selectedWindow;
}

function receiveMessage(event) {
    var parts = event.data.split(" ");
    if (parts[0] == "requestid") {
        event.source.postMessage("id " + lastFrame, event.origin);
    }
    else if (parts[0] == "done") {
        var id = event.data.substring(1);
        $("#" + id).find(".terminalScriptUI").hide();
        $("#" + id).find(".window").show();
        getTerminalFromId(id).inProg = false;
    }
}

function getEnv(key) {
    for (var i = 0; i < state.wsh.env.length; i++) {
        if (state.wsh.env[i].key == key) {
            return state.wsh.env[i].value;
        }
    }
    return "";
}

function setEnv(key, value) {
    for (var i = 0; i < state.wsh.env.length; i++) {
        if (state.wsh.env[i].key == key) {
            state.wsh.env[i].value = value;
            return;
        }
    }
    state.wsh.env.push({ key: key, value: value });
}

window.addEventListener("message", receiveMessage, false);