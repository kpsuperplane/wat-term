// Basic items

function createDirectory(n) {
    return {
        type: DIR_TYPE,
        name: n,
        data: []
    };
}

function createFile(name) {
    return {
        type: FILE_TYPE,
        name: name,
        data: ""
    };
}

function createAlias(alias, command) {
    return { alias: alias, command: command };
}

// Dependent items

function createWelcomeDirectory() {
    var dir = createDirectory("~");
    dir.data.push({
        type: FILE_TYPE,
        name: "Welcome",
        data: "Welcome to WatTerm! Here is some information about some stuff!\n"
    });
    return dir;
}
