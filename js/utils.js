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
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};