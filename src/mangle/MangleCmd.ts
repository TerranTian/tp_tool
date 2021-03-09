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
let content: string = FileUtil.readString(input);
// content = content.replace(/\[["'](\w+)["']\]/g, (str, name) => {
//     return "." + name;
// })

let collisionMap = {};
falafel(content,{ecmaVersion:6} ,function (node) {
    if (node.type == "Identifier") {
        collisionMap[node.name] = 1;
    }else if(node.type == "Literal"){
        let v = node.source();
        if(v[0] == '"'){
            v= v.substr(1,v.length-2);//rm "
            whiteMap[v] = 1;
            console.log("add",v,v.length);
        }
    }
})
for (let key in nameMap) {
    collisionMap[nameMap[key]] = 1;
}

let keyWords=[
    "if","while","for","else","let","var","const","function","class","number","boolean","NaN","void","undifined","string","break","default","return","case","call","apply","switch","do","of","in","continue","true","false"
]
keyWords.forEach(v=>collisionMap[v] = 1);
// Object.assign(collisionMap,nameMap)


var output = falafel(content,{ecmaVersion:6} , function (node) {
    // console.log(node.type, node.source());
    if (node.type == "Identifier") {
        // console.log(node.source(), node.name)
        var name: string = node.name;
        if (dropMap[name]) return;
        if (whiteMap[name]){
            console.log("white",name);
            return;
        };

        if (resolved[name]) return;
        if (name.length <= 2) return;

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
