// This file will download all the needed files to perform the runHacking routine.
// These will only go through the actions of weaken/grow/hacking servers.
import { BASEURL, SERVER_MAP, } from 'common.js'
const filesToDownload = [
    'common.js',
    'mainHack.js',
    'spider.js',
    'grow.js',
    'hack.js',
    'weaken.js',
    'playerServers.js',
    'killAll.js',
    'runHacking.js',
    'find.js',
    'stocks.js',
    'contract_solver.js',
    'helpers.js',
]
const valuesToRemove = [SERVER_MAP]

/** @param {NS} ns */
async function areYouSure(ns) {
    let anyfilesexist = false
    for (let filename of filesToDownload) {
        if (ns.fileExists(filename)){
            anyfilesexist = true
        }
    }
    if (anyfilesexist) {
        if (!await ns.prompt(`Are you sure? This will overwrite current scripts.`)) {
            ns.exit()
        }
        if (!await ns.prompt("Are you REALLY sure? Local edits will be lost")) {
            ns.exit()
        }
    }
}


/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting initHacking.js`)
    
    let hostname = ns.getHostname()
    
    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }
    await areYouSure(ns);
    
    for (let i = 0; i < filesToDownload.length; i++) {
        const filename = filesToDownload[i]
        const path = BASEURL + filename
        await ns.scriptKill(filename, 'home')
        await ns.rm(filename)
        await ns.sleep(200)
        ns.tprint(`Trying to download ${path}`)
        await ns.wget(path + '?ts=' + new Date().getTime(), filename)
    }
    
    valuesToRemove.map((value) => localStorage.removeItem(value))
    
    ns.tprint(`Spawning killAll.js`)
    ns.spawn('killAll.js', 1, 'runHacking.js')
}
