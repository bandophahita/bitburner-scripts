import { localeHHMMSS, getPlayerDetails, hackScripts, createUUID, convertMSToHHMMSS,
    getServerMap,
} from 'common.js'

const settings = {
    homeRamReserved: 20,
    homeRamReservedBase: 30,
    homeRamExtraRamReserved: 64, // need to figure out a better tiered way to handle this value
    homeRamBigMode: 64,
    minSecurityLevelOffset: 1,
    maxMoneyMultiplayer: 0.9,
    minSecurityWeight: 100,
    mapRefreshInterval: 24 * 60 * 60 * 1000, // every 24 hours?
    maxWeakenTime: 30 * 60 * 1000,
}

const HACK = 0.002;
const GROW = 0.004;
const WEAKEN = 0.05;
const RAM_HACK = 1.7;
const RAM_GROW = 1.75;
const RAM_WEAK = 1.75;
const SPIDER_TIMEOUT = 1000 * 60 // 60 seconds
const SPIDER_RETRY_LIMIT = 5;


/**
 * @typedef {Object} MyServer
 * @property {string} host
 * @property {number} ports
 * @property {number} hackingLevel
 * @property {number} maxMoney
 * @property {number} growth
 * @property {number} minSecurityLevel
 * @property {number} baseSecurityLevel
 * @property {number} ram
 * @property {string[]} connections
 * @property {string} parent
 * @property {string[]} children
 * @property {string[]} files
 */

// ------------------------------------------------------------------------------------------------
/**
 * @param {number} growCycles
 * @returns {number}
 */
function weakenCyclesForGrow(growCycles) {
    return Math.max(0, Math.ceil(growCycles * (GROW / WEAKEN)))
}

// ------------------------------------------------------------------------------------------------
/** @param {number} hackCycles */
function weakenCyclesForHack(hackCycles) {
    return Math.max(0, Math.ceil(hackCycles * (HACK / WEAKEN)))
}

// ------------------------------------------------------------------------------------------------
/**
 * @param {NS} ns
 * @param {Object.<MyServer>} servers
 * @returns {Promise<string[]>}
 */
async function getHackableServers(ns, servers) {
    const playerDetails = getPlayerDetails(ns)
    
    const hackableServers = Object.keys(servers)
        .filter((hostname) => ns.serverExists(hostname))
        .filter((hostname) => servers[hostname].ports <= playerDetails.portHacks || ns.hasRootAccess(hostname))
        .filter((hostname) => servers[hostname].ram >= 2)
    
    for (const host of hackableServers) {
        if (host === 'home') continue;
        
        if (!ns.hasRootAccess(host)) {
            // let server = serverMap.servers[host];
            let server = servers[host]
            let canBeHacked = server.ports <= playerDetails.portHacks && server.hackingLevel <= playerDetails.hackingLevel
            if (canBeHacked) {
                let nPortsNeeded = server.ports;
                if (nPortsNeeded >= 5) {await ns.sqlinject(host)}
                if (nPortsNeeded >= 4) {await ns.httpworm(host)}
                if (nPortsNeeded >= 3) {await ns.relaysmtp(host)}
                if (nPortsNeeded >= 2) {await ns.ftpcrack(host)}
                if (nPortsNeeded >= 1) {await ns.brutessh(host)}
                await ns.nuke(host);
            }
        }
        await ns.scp(hackScripts, host)
    }
    hackableServers.sort((a, b) => servers[a].ram - servers[b].ram)
    return hackableServers
}

// ------------------------------------------------------------------------------------------------
/**
 * @param {NS} ns
 * @param {Array<string>} serversList
 * @param {Object.<MyServer>} servers
 * @param {Object} serverExtraData
 * @returns {Array<string>}
 */
function findTargetServer(ns, serversList, servers, serverExtraData) {
    const playerDetails = getPlayerDetails(ns)
    
    serversList = serversList
        .filter((hostname) => servers[hostname].hackingLevel <= playerDetails.hackingLevel)
        .filter((hostname) => servers[hostname].maxMoney)
        .filter((hostname) => hostname !== 'home')
        .filter((hostname) => ns.getWeakenTime(hostname) < settings.maxWeakenTime)
    
    let weightedServers = serversList.map((hostname) => {
        const fullHackCycles = Math.ceil(100 / Math.max(0.00000001, ns.hackAnalyze(hostname)))
        const host = servers[hostname]
        serverExtraData[hostname] = {
            fullHackCycles,
        }
        const serverValue = host.maxMoney * (settings.minSecurityWeight / (host.minSecurityLevel + ns.getServerSecurityLevel(hostname)))
        
        return {
            hostname,
            serverValue,
            minSecurityLevel: host.minSecurityLevel,
            securityLevel: ns.getServerSecurityLevel(hostname),
            maxMoney: host.maxMoney,
        }
    })
    weightedServers.sort((a, b) => b.serverValue - a.serverValue)
    // SHOW the Array of dictionaries 
    //ns.print(JSON.stringify(weightedServers, null, 2)) 
    return weightedServers.map((server) => server.hostname)
}


// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
export async function main(ns) {
    ns.print(" ####################### START OF SCRIPT ############################### ")
    ns.disableLog("disableLog")
    ns.disableLog("exec");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getHackingLevel");
    ns.disableLog("scp");
    ns.disableLog("sleep");
    
    ns.tprint(`Starting mainHack.js`)
    let targetNameManual = ns.args[0]
    let targetName
    
    if (ns.getHostname() !== 'home') {throw new Exception('Run the script from home')}
    
    while (true) {
        const serverExtraData = {}
        const serverMap = await getServerMap(ns)
        
        // TODO: detect if home ram was upgraded. 
        if (serverMap.servers.home.ram >= settings.homeRamBigMode) {
            settings.homeRamReserved = settings.homeRamReservedBase + settings.homeRamExtraRamReserved
        }
        serverMap.servers.home.ram = Math.max(0, serverMap.servers.home.ram - settings.homeRamReserved)
        
        const hackableServers = await getHackableServers(ns, serverMap.servers)
        const targetServers = findTargetServer(ns, hackableServers, serverMap.servers, serverExtraData)
        
        ns.print("-".repeat(80))
        ns.tprint("-".repeat(80))
        ns.print(JSON.stringify(targetServers))
        
        if (!targetNameManual) {
            targetName = targetServers[0]
        } else {
            targetName = targetNameManual
        }
        
        const hackTime = ns.getHackTime(targetName)
        const growTime = ns.getGrowTime(targetName)
        const weakenTime = ns.getWeakenTime(targetName)
        const growDelay = Math.max(0, weakenTime - growTime - 15 * 1000)
        const hackDelay = Math.max(0, growTime + growDelay - hackTime - 15 * 1000)
        const securityLevel = ns.getServerSecurityLevel(targetName)
        const money = ns.getServerMoneyAvailable(targetName)
        const target = serverMap.servers[targetName]
        
        let action = 'weaken'
        if (securityLevel > target.minSecurityLevel + settings.minSecurityLevelOffset) {
            action = 'weaken'
        } else if (money < target.maxMoney * settings.maxMoneyMultiplayer) {
            action = 'grow'
        } else {
            action = 'hack'
        }
        
        let hackCycles = 0
        let growCycles = 0
        let weakenCycles = 0
        
        for (let i = 0; i < hackableServers.length; i++) {
            const server = serverMap.servers[hackableServers[i]]
            hackCycles += Math.floor(server.ram / RAM_HACK)
            growCycles += Math.floor(server.ram / RAM_GROW)
        }
        weakenCycles = growCycles
        
        // ns.print("-------------------------- START ---------------------------------")
        // ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
        // ns.print(Object.keys(serverMap))
        // ns.print(JSON.stringify(serverMap, undefined, 2))
        // ns.print(target)
        // ns.print(`Stock: baseSecurity: ${target.baseSecurityLevel}; minSecurity: ${target.minSecurityLevel}; maxMoney: $${ns.nFormat(target.maxMoney, "0,0")}`)
        // ns.print(`Current: SECURITY: ${Math.floor(securityLevel * 1000) / 1000}; MONEY: $${ns.nFormat(money, "0,0")}`)
        // ns.print("-------------------------- END ---------------------------------")
        
        ns.tprint(`TARGET: ${targetName}  ACTION: ${action}  WAKE: ${localeHHMMSS(new Date().getTime() + weakenTime + 300)} (${convertMSToHHMMSS(weakenTime + 300)})`)
        ns.tprint(`Stock: baseSecurity: ${target.baseSecurityLevel}; minSecurity: ${target.minSecurityLevel}; maxMoney: $${ns.nFormat(target.maxMoney, "0.0a")}`)
        ns.tprint(`Current: SECURITY: ${Math.floor(securityLevel * 1000) / 1000}; MONEY: $${ns.nFormat(money, "0.0a")}`)
        // ns.tprint(`TimeTo: HACK: ${convertMSToHHMMSS(hackTime)} GROW: ${convertMSToHHMMSS(growTime)} WEAKEN: ${convertMSToHHMMSS(weakenTime)}`)
        // ns.tprint(`Delays: HACK: ${convertMSToHHMMSS(hackDelay)} GROW: ${convertMSToHHMMSS(growDelay)}`)
        
        if (action === 'weaken') { //WEAKEN
            if (WEAKEN * weakenCycles > securityLevel - target.minSecurityLevel) {
                weakenCycles = Math.ceil((securityLevel - target.minSecurityLevel) / WEAKEN)
                growCycles -= weakenCycles
                growCycles = Math.max(0, growCycles)
                weakenCycles += weakenCyclesForGrow(growCycles)
                growCycles -= weakenCyclesForGrow(growCycles)
                growCycles = Math.max(0, growCycles)
            } else {
                growCycles = 0
            }
            
            // ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}  expected security reduction: ${Math.floor(WEAKEN * weakenCycles * 1000) / 1000}`)
            //ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}  expected security reduction: ${Math.floor(WEAKEN * weakenCycles * 1000) / 1000}`)
            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_WEAK))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))
                
                if (growCycles) {
                    await ns.exec('grow.js', server.host, cyclesToRun, targetName, cyclesToRun, growDelay, createUUID())
                    growCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }
                
                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        } else if (action === 'grow') { // GROW
            weakenCycles = weakenCyclesForGrow(growCycles)
            growCycles -= weakenCycles
            
            // ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}`)
            
            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_GROW))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))
                
                if (growCycles) {
                    await ns.exec('grow.js', server.host, cyclesToRun, targetName, cyclesToRun, growDelay, createUUID())
                    growCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }
                
                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        } else { //HACK
            if (hackCycles > serverExtraData[targetName].fullHackCycles) {
                hackCycles = serverExtraData[targetName].fullHackCycles
                
                if (hackCycles * 100 < growCycles) {
                    hackCycles *= 10
                }
                
                growCycles = Math.max(0, growCycles - Math.ceil((hackCycles * RAM_HACK) / RAM_GROW))
                
                weakenCycles = weakenCyclesForGrow(growCycles) + weakenCyclesForHack(hackCycles)
                growCycles -= weakenCycles
                hackCycles -= Math.ceil((weakenCyclesForHack(hackCycles) * RAM_WEAK) / RAM_HACK)
                
                growCycles = Math.max(0, growCycles)
            } else {
                growCycles = 0
                weakenCycles = weakenCyclesForHack(hackCycles)
                hackCycles -= Math.ceil((weakenCycles * RAM_WEAK) / RAM_HACK)
            }
            
            // ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
            //ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_HACK))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, hackCycles))
                
                if (hackCycles) {
                    await ns.exec('hack.js', server.host, cyclesToRun, targetName, cyclesToRun, hackDelay, createUUID())
                    hackCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }
                
                const freeRam = server.ram - cyclesToRun * RAM_HACK
                cyclesFittable = Math.max(0, Math.floor(freeRam / 1.75))
                
                if (cyclesFittable && growCycles) {
                    const growCyclesToRun = Math.min(growCycles, cyclesFittable)
                    
                    await ns.exec('grow.js', server.host, growCyclesToRun, targetName, growCyclesToRun, growDelay, createUUID())
                    growCycles -= growCyclesToRun
                    cyclesFittable -= growCyclesToRun
                }
                
                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        }
        
        await ns.sleep(weakenTime + 300)
    }
}
