import axios from 'axios';
import * as download from 'download';
import xlrd from"node-xlsx";

async function downloadExcel(fileId, cookie) {
    let type = 'xlsx';
    const url = 'https://shimo.im/lizard-api/files/' + fileId + '/export';
    
    console.log("exporting...:",url);
    const response = await axios.get(url, {
    params: {
            type: type,
            file: fileId,
            returnJson: '1',
            isAsync: '0',
        },
        headers: {
            Cookie: cookie,
            Referer: 'https://shimo.im/folder/123',
        }
    });

    if (!response.data.redirectUrl) {
        throw new Error(' failed, error: '+response.data);
    }

    // return download(response.data.redirectUrl).then(data => {
    //     fs.writeFileSync(item.name+'.xlsx', data);
    // });

    console.log("download...:",response.data.redirectUrl);
    let data = await download(response.data.redirectUrl);
    return data;
}

export async function parse_shimo(fileId:string, cookie:string, config:{nameRow:number,typeRow:number,dataRow:number}):Promise<{keys:string[],types:string[],values:any[][]}> {
    let buffer = await downloadExcel(fileId,cookie);
    console.log("parsing...");
    let sheets = xlrd.parse(buffer);
    let data = sheets[0].data;
    let columNames = data[config.nameRow];
    let columTypes = data[config.typeRow];
    let rows = data.splice(config.dataRow);

    let keys = [];
    let types = [];
    let values = [];

    for (let i = 0; i < columNames.length; ++i) {
        let name = columNames[i];
        if (name.startsWith("#") || name.length == 0) continue;
        keys.push(name);
        types.push(columTypes[i]);
    }

    for(let row of rows){
        if (!row[0]) break;
        var rowValues = [];
        for (let i = 0; i < columNames.length; ++i) {
            let name = columNames[i];
            if (name.startsWith("#") || name.length == 0) continue;
            let value = row[i];
            
            rowValues.push(value);
        }
        values.push(rowValues);
    }

    return {keys,values,types};
};
