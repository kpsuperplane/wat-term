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
