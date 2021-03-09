
import * as path from "path";
import * as fs from "fs";
import { exit } from "process";
import { FileUtil } from "../core/FileUtil";
import { Tiny } from "../core/Tiny";
import { domprops } from "./DomProps";
import { whiteList } from "./WhiteList";

let dir = path.dirname(process.argv[1]);
let parameters = process.argv.splice(2);

let dropMap = {};
domprops.forEach(v => dropMap[v] = 1);

let whiteMap = {};
whiteList.forEach(v => whiteMap[v] = 1);

let input: string = null;
let out: string = null;
let regex: string = null;
let resolved: { [key: string]: number } = {};
let nameCache: string = null;
let nameCacheMap = {};

while (parameters.length > 0) {
    let value = parameters.shift();
    switch (value) {
        case "-i":
        case "--input":
            input = parameters.shift();
            break;
        case "-o":
        case "--output":
            out = parameters.shift() || input;
            break;
        case "--regex":
            regex = parameters.shift() || null;
            break
        case "--resolved":
            let value = parameters.shift() || "";
            value.split(",").forEach(v => resolved[v] = 1)
            break
        case "--nameCache":
            nameCache = parameters.shift();
            nameCache && (nameCacheMap = JSON.parse(FileUtil.readString(nameCache)) || {});
            break
        default:
            break;
    }
}
out = out || input;

if (!input) {
    let message = `
    wrong arguments:
    -i/--input: js to mangle
    --regex: [option] Only mangle matched property names
    --resolved: [option] Only mangle matched property names: _bar,_foor
    --nameCache: File to hold mangled name mappings
    -o/--out: [option] out path
`
    console.log(message);
    exit(1);
}

var falafel = require('falafel');


let nameMap = nameCacheMap;
let value = 0;
let content = FileUtil.readString(input);

let collisionMap = {};
falafel(content, function (node) {
    if (node.type == "Identifier") {
        collisionMap[node.name] = 1;
    }
})

var output = falafel(content, function (node) {
    if (node.type == "Identifier") {
        // console.log(node.source(), node.name)
        var name: string = node.name;
        if (dropMap[name]) return;
        if (whiteMap[name]) return;

        if (resolved[name]) return;
        if (name.length < 2) return;

        if (!regex || new RegExp(regex).test(name)) {
            let newName = nameMap[name];
            if (!newName) {
                while (true) {
                    newName = Tiny.encode(value++);
                    if (!collisionMap[newName]) break;
                }
                nameMap[name] = newName;
            }

            node.update(newName);
        }
    }
});

nameCache && (FileUtil.writeString(nameCache, JSON.stringify(nameCacheMap)));
FileUtil.writeString(out, output);
