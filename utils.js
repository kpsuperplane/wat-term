function getCol(a) {
    return parseInt(a.split(DELIMITER)[0]);
}

function getRow(a) {
    return parseInt(a.split(DELIMITER)[1]);
}

function splitSpace(string) {
    var parts = string.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g);
    if (parts != null) {
        for (var i = 0; i < parts.length; i++) {
            parts[i] = parts[i].replace(/"/g, "");
            parts[i] = parts[i].replace(/'/g, "");
        }
        return parts;
    }
    return [""];
}
