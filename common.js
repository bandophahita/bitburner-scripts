import {
    formatMoney, formatRam, formatDuration, formatDateTime, formatNumber,
    scanAllServers, hashCode, disableLogs, log as logHelper, getFilePath,
    getNsDataThroughFile_Custom, runCommand_Custom, waitForProcessToComplete_Custom,
    tryGetBitNodeMultipliers_Custom, getActiveSourceFiles_Custom,
    getFnRunViaNsExec, getFnIsAliveViaNsPs
} from './helpers.js'

export const BASEURL = 'https://raw.githubusercontent.com/bandophahita/bitburner-scripts/main/'
export const hackPrograms = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
export const hackScripts = ['hack.js', 'grow.js', 'weaken.js']

export const ACTION = 'BB_ACTION'
export const HACK_TARGET = 'BB_HACK_TARGET'
export const SERVER_MAP = 'BB_SERVER_MAP'
export const SPIDER_TIMEOUT = 1000 * 60 // 60 seconds
export const SPIDER_RETRY_LIMIT = 5;
export const MAPREFRESHINTERVAL = 1 * 60 * 60 * 1000 // 1 hour


export const settings = {
    maxPlayerServers: 25,
    mapRefreshInterval: MAPREFRESHINTERVAL,
    
    keys: {
        serverMap: SERVER_MAP,
        hackTarget: HACK_TARGET,
        action: ACTION,
    },
    changes: {
        hack: 0.002,
        grow: 0.004,
        weaken: 0.05,
    },
}


/** @param {NS} ns */
export function getPlayerDetails(ns) {
    let portHacks = 0
    
    hackPrograms.forEach((hackProgram) => {
        if (ns.fileExists(hackProgram, 'home')) {
            portHacks += 1
        }
    })
    
    return {
        hackingLevel: ns.getHackingLevel(),
        portHacks,
    }
}


// ------------------------------------------------------------------------------------------------
export function getItem(key) {
    let item = localStorage.getItem(key)
    return item ? JSON.parse(item) : undefined
}

// ------------------------------------------------------------------------------------------------
export function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

// ------------------------------------------------------------------------------------------------
/** @param {number} ms */
export function localeHHMMSS(ms = 0) {
    if (!ms) {
        ms = new Date().getTime()
    }
    return new Date(ms).toLocaleTimeString()
}

/** @param {number} ms */
export function convertMSToHHMMSS(ms = 0) {
    if (ms <= 0) {
        return '00:00:00'
    }
    
    if (!ms) {
        ms = new Date().getTime()
    }
    
    return new Date(ms).toISOString().substr(11, 8)
}

export function createUUID() {
    var dt = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0
        dt = Math.floor(dt / 16)
        return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return uuid
}


// SHOULD NOT BE IN COMMON. COULD CAUSE CIRCULAR IMPORTS WITH SPIDER
/** @param {NS} ns */
export async function getServerMap(ns) {
    // used to fetch the servermap 
    let spider_loop_count = 0;
    while (true) {
        if (spider_loop_count > SPIDER_RETRY_LIMIT) {
            throw new Exception(`Exceeded ${SPIDER_RETRY_LIMIT} retries to update serverMap`)
        }
        let serverMap = getItem(SERVER_MAP)
        // if serverMap is empty or old, refresh it
        if (!serverMap || serverMap.lastUpdate < new Date().getTime() - MAPREFRESHINTERVAL) {
            if (!serverMap) {
                ns.print("no serverMap found")
            } else if (serverMap.lastUpdate < new Date().getTime() - MAPREFRESHINTERVAL) {
                ns.print("serverMap is old.")
            }
            ns.print(`Spawning spider.js`)
            ns.tprint(`Spawning spider.js`)
            const pid = ns.exec(getFilePath('spider.js'), 'home', 1);
            await waitForProcessToComplete_Custom(ns, getFnIsAliveViaNsPs(ns), pid);
            spider_loop_count++
            continue;
        }
        return serverMap
    }
}



// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("************* COMMON WAS CALLED!!!! ******************")
    let sm = await getServerMap(ns)
    ns.print(JSON.stringify(sm, undefined, 2))
    ns.print("printed from common.js")
    ns.print("common.js is finished")
}
