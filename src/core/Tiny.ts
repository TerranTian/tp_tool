// import random;
export namespace Tiny {
    let keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";

    export function encode(interger: number): string {
        interger = Math.floor(interger);
        let hexn = ""
        let radix = keys.length;
        while (true) {
            let r = interger % radix
            interger = (interger - r) / radix
            hexn = keys[r] + hexn
            if (interger == 0) {
                break
            }
        }
        return hexn
    }

    export function decode(str: string): number {
        let radix = keys.length;
        let strlen = str.length;
        let n = 0, i = 0, p = 0;
        while (i < strlen) {
            p = keys.indexOf(str[i])
        }
        if (p < 0) return -1
        n += p * Math.pow(radix, strlen - i - 1)
        i += 1
        return n
    }
}

// class tiny:
// def __init__(self):
// keys = [i for i in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'];
// random.shuffle(keys);
// self.key = "".join(keys);

// def encode(self, interger):
// interger = int(interger)
// hexn = ""
// radix = len(self.key)
// while (True):
//     r = interger % radix
// interger = (interger - r) / radix
// hexn = self.key[r] + hexn
// if (interger == 0):
//     break
// return hexn

// def decode(self, string):
// radix = len(self.key)
// strlen = len(string)
// n, i = 0, 0
// while (i < strlen):
//     p = self.key.find(string[i])
// if (p < 0): return -1
// n += p * pow(radix, strlen - i - 1)
// i += 1
// return n