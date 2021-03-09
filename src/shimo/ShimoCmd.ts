
import * as path from "path";
import * as fs from "fs";
import { parse_shimo } from "./Shimo";
import { exit } from "process";

let dir = path.dirname(process.argv[1]);
let parameters = process.argv.splice(2);


let fileId: string = null;
let cookie: string = null;

let nameRow = 0;
let typeRow = 1;
let dataRow = 2;

let format = "common";
let out = "";

while (parameters.length > 0) {
    let value = parameters.shift();
    switch (value) {
        case "-c":
        case "--cookie":
            cookie = parameters.shift();
            break;
        case "-i":
        case "--fileId":
            fileId = parameters.shift();
            break;
        case "-n":
        case "--nameRow":
            nameRow = +parameters.shift() || 0;
            break;
        case "-t":
        case "--typeRow":
            typeRow = +parameters.shift() || 1;
            break;
        case "-d":
        case "--dataRow":
            dataRow = +parameters.shift() || 1;
            break;
        case "-f":
        case "--format":
            format = parameters.shift() || "common";
            break;
        case "-o":
        case "--out":
            out = parameters.shift() || "";
            break;
        default:
            break;
    }
}

if (!cookie || !fileId || !out) {
    let message = `
    wrong arguments:
    -c/--cookie: copy from one of shimo's request.
    -i/--fileId: shimo's document id: https://shimo.im/sheets/<docment id>/MODOC
    -n/--nameRow: the index of row for name, default:0
    -t/--typeRow: the index of row for type, default:1
    -d/--dataRow: the index of row for data, default:1
    -f/--format: the json format, default:common, which with full key,[{key1:value1,key2:value2},{key1:value1,key2:value2}], otherwise [keys:[key1,key2],values:[[value1,value2],[value1,value2]]]
    -o/--out: out path
`
    console.log(message);
    exit(1);
}

!async function () {
    let data = await parse_shimo(fileId, cookie, { nameRow: +nameRow, typeRow: +typeRow, dataRow: +dataRow })
    if (format == "common") {
        let contents = [];
        data.values.forEach(v => {
            let item = {};
            v.forEach((v, index) => {
                item[data.keys[index]] = v;
            })
            contents.push(item);
        })
        fs.writeFileSync(out, JSON.stringify(contents));
    } else {
        delete data.types;
        fs.writeFileSync(out, JSON.stringify(data));
    }

    console.log("export done:", out);
}();

