#!/usr/bin/env node

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

let inputs: string[] = [];
let out: string = null;
let regex: string = null;
let resolved: { [key: string]: number } = {};
let nameCache: string = null;


let cache_data = {
    nameCacheMap: {},
    collisionMap: {},
    literalMap: {}
};

while (parameters.length > 0) {
    let value = parameters.shift();
    switch (value) {
        case "-i":
        case "--input":
            inputs = [parameters.shift()];
            break;
        case "-o":
        case "--output":
            out = parameters.shift();
            break;
        case "--regex":
            regex = parameters.shift() || null;
            break
        case "--resolved":
            {
                let value = parameters.shift() || "";
                value.split(",").forEach(v => resolved[v] = 1)
            }
            break
        case "--nameCache":
            nameCache = parameters.shift();
            nameCache && (
                Object.assign(cache_data, JSON.parse(FileUtil.readString(nameCache)))
            );
            break
        default:
            inputs.push(value);
            break;
    }
}
out = out || inputs[0];
console.log(inputs);

if (inputs.length == 0) {
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

let nameMap = cache_data.nameCacheMap;
let collisionMap = cache_data.collisionMap;
let literalMap = cache_data.literalMap;

for (let key in nameMap) {
    collisionMap[nameMap[key]] = 1;
}

let keyWords = [
    "if", "while", "for", "else", "let", "var", "const", "function", "class", "number", "boolean", "NaN", "void", "undifined", "string", "break", "default", "return", "case", "call", "apply", "switch", "do", "of", "in", "continue", "true", "false"
]
keyWords.forEach(v => collisionMap[v] = 1);

let value = 0;

function canUse(name) {
    if (collisionMap[name]) return false;
    if (dropMap[name]) return false;
    if (whiteMap[name]) return false;
    if (literalMap[name]) return false;

    return true;
}

inputs.forEach((input, index) => {
    let content: string = FileUtil.readString(input);
    falafel(content, { ecmaVersion: 6 }, function (node) {
        if (node.type == "Identifier") {
            collisionMap[node.name] = 1;
        } else if (node.type == "Literal") {
            // console.log(node.type, node.source());
            let v: string = node.source();
            if (v[0] == '"') {

                // v = v.substr(1, v.length - 2);//rm "
                // literalMap[v] = 1;
                v.replace(/[a-zA-Z0-9_$]+/ig, (w) => {
                    literalMap[w] = 1;
                    return w;
                });
            }
        }
    })
});
console.log("literalMap:", JSON.stringify(literalMap, null, 4))
inputs.forEach((input, index) => {
    let content: string = FileUtil.readString(input);
    var output = falafel(content, { ecmaVersion: 6 }, function (node) {
        // console.log(node.type, node.source());
        if (node.type == "Identifier") {
            var name: string = node.name;
            if (dropMap[name]) return;
            if (whiteMap[name]) return;
            if (literalMap[name]) return;

            if (resolved[name]) return;
            if (name.length <= 2) return;

            if (!regex || new RegExp(regex).test(name)) {
                let newName = nameMap[name];
                if (!newName) {
                    while (true) {
                        newName = Tiny.encode(value++);
                        if (canUse(newName)) break;
                    }
                    nameMap[name] = newName;
                }
                node.update(newName);
            }
        }
    });
    FileUtil.writeString(index == 0 ? out : input, output);
})

nameCache && (FileUtil.writeString(nameCache, JSON.stringify(cache_data)));
