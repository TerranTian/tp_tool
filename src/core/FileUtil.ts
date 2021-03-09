
import * as path from "path";
import * as fs from "fs";

export namespace FileUtil {
    export function mkdir(dir, mode = 777) {
        try {
            fs.mkdirSync(dir, mode);
        } catch (e) {
            if (e.errno === 34) {
                mkdir(path.dirname(dir), mode);
                mkdir(dir, mode);
            }
        }
    }

    export function getFilesSync(p, filter) {
        let result = [];
        let arr = [p];
        for (let i = 0; i < arr.length; i++) {
            let dir = arr[i];
            let items = fs.readdirSync(dir);
            items.forEach(filename => {
                let filePath = path.join(dir, filename)
                let stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    arr.push(filePath);
                } else {
                    if (!filter || filter(filePath)) {
                        result.push(filePath);
                    }
                }
            })
        }
        return result;
    }

    export function readString(p) {
        if (fs.existsSync(p)) {
            return fs.readFileSync(p, 'utf-8').replace("\ufeff", "")//why?
        }
        return null
    }

    export function writeString(p, content) {
        mkdir(path.dirname(p), 777);
        fs.writeFileSync(p, content, { encoding: "utf8" });
    }
}