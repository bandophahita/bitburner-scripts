#!/usr/bin/env python3

import json
import base64
import argparse

def decodeSave(inFileName):
    print("Reading and decoding %s" % inFileName)
    with open(inFileName, 'r') as inFile:
        b64s = inFile.read()
        d = json.loads(base64.b64decode(b64s))
        for key in d['data'].keys():
            if type(d['data'][key]) == str and len(d['data'][key]) > 0:
                print("Converting d['data']['%s'] from str to dict" % key)
                d['data'][key] = json.loads(d['data'][key])
        return d

def encodeSave(data, outFileName):
    with open(outFileName, 'wb') as outFile:
        for key in data['data'].keys():
            if type(data['data'][key]) == dict:
                print("Converting data['data']['%s'] from dict to str" % key)
                data['data'][key] = json.dumps(data['data'][key])
        dStr = json.dumps(data)
        b64s = base64.standard_b64encode(dStr.encode('utf-8'))
        print("Writing %s" % outFileName)
        outFile.write(b64s)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    grp = parser.add_mutually_exclusive_group(required = True)
    grp.add_argument("--decode", action="store_true")
    grp.add_argument("--encode", action="store_true")
    parser.add_argument('file1')
    parser.add_argument('file2')
    args = parser.parse_args()

    print(args)

    if args.decode:
        d = decodeSave(args.file1)
        with open(args.file2, 'w') as outFile:
            json.dump(d, outFile, indent=4)
        print("Wrote to %s" % args.file2)
    elif args.encode:
        print("Reading %s, encoding to %s" % (args.file1, args.file2))
        with open(args.file1, 'r') as inFile:
            data = json.load(inFile)
            encodeSave(data, args.file2)
            print("Wrote to %s " % args.file2 )
