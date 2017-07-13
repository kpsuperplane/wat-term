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
var DELIMITER = "-";

var windowWidth;
var windowHeight;
var selectedWindow = "0" + DELIMITER + "0";

var defaultWindow = '<div class="windowWrapper" style="height: $(SIZE)" id="$(FULLID)" tabindex="1"><div class="window" id="$(ID)">$(TERM)</div></div>';
var defaultColumn = '<div class="column" id="$(ID)" style="width: $(SIZE)">$(CONTENT)</div>';
var defaultTerminal = '<div class="hidden"><input type="text" class="textbox"></div><div class="terminal"></div><span class="prompt">felixguo@walter $ </span><span class="before"></span><span class="cursor blink">&nbsp;</span><span class="after"></span>';

$(document).ready(function() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    var defaultStateObject = {};
    defaultStateObject[STATE_KEY] = createDefaultState();
    chrome.storage.local.get(defaultStateObject, 
    function(items) {
        console.log(items);
        state = items[STATE_KEY];
        rebuildWindows();
    });
    document.addEventListener('keydown', globalOnKeyDown, false);
    selectWindow(selectedWindow);
});

function globalOnKeyDown(e) {
    var changed = true;
    if (event.shiftKey && e.keyCode == KEY_LEFT_ARROW) {
        var col = getCol(selectedWindow);
        console.log(col);
        if (col != 0) {
            state.columns[col - 1].width--;
            state.columns[col].width++;
        }
        else {
            state.columns[col + 1].width++;
            state.columns[col].width--;
        }
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
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_I) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].windows[row].height / 2;
        state.columns[col].windows[row].height = collapse;
        state.columns[col].windows.splice(row, 0, createWindow(collapse));
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_K) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].windows[row].height / 2;
        state.columns[col].windows[row].height = collapse;
        state.columns[col].windows.splice(row + 1, 0, createWindow(collapse));
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_J) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].width / 2;
        state.columns[col].width = collapse;
        state.columns.splice(col, 0, createColumn(collapse));
    }
    else if (event.ctrlKey  && event.shiftKey && e.keyCode == KEY_L) {
        var row = getRow(selectedWindow);
        var col = getCol(selectedWindow);
        var collapse = state.columns[col].width / 2;
        state.columns[col].width = collapse;
        state.columns.splice(col + 1, 0, createColumn(collapse));
    }
    else {
        changed = false;
    }
    if (changed) {
        rebuildWindows();
    }
}

function getCol(a) {
    return parseInt(a.split(DELIMITER)[0]);
}

function getRow(a) {
    return parseInt(a.split(DELIMITER)[1]);
}

function selectWindow(newID) {
    $("#" + selectedWindow).find(".window").removeClass("selected");
    selectedWindow = newID;
    $("#" + selectedWindow).find(".window").addClass("selected");
    $("#" + selectedWindow).find(".textbox").focus();
    setTimeout(function () { $("#" + selectedWindow).find(".textbox").focus(); }, 1);
}
function bindEvents() {
    $(".windowWrapper").click(function() {
       selectWindow($(this).attr("id"));
    });

    $(".textbox").keydown(function(e) {
        updateTextbox(this);
    });
    $(".textbox").keyup(function(e) {
        updateTextbox(this);
    });
}

function updateTextbox(sender) {
    var cursorPos = $(sender)[0].selectionStart;
    var string = $(sender).val();
    console.log(cursorPos);
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
    return state.columns[getCol(selectedWindow)].windows[getRow(selectedWindow)].terminal;
}

function createDefaultState() {
    return { username: "Untitled", 
             columns: [createColumn(100)] };
}

function createWindow(h) {
    return { height: h, terminal: createTerminal() };
}

function createTerminal() {
    return { prompt: "", output: "WatTerm 1.0\n", in_prog: false, history: "" };
}

function createColumn(w) {
    return { width: w, windows: [createWindow(100)] };
}

function updateState() {
    chrome.storage.local.set({ STATE_KEY: state });
}

function rebuildWindows() {
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
}

function updateTerminal() {
    
}