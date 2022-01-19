// This handles buying and upgrading all of the player owned servers.
import { setItem, createUUID, SERVER_MAP, getServerMap } from 'common.js'

const BUY = 'buy'
const UPGRADE = 'upgrade'

const settings = {
    // this variables get updated 
    maxPlayerServers: 25,
    maxGbRam: 1048576,
    
    gbRamCost: 55000,
    minGbRam: 64,
    totalMoneyAllocation: 0.8, // 70%
}


/** @param {NS} ns */
function getAvailableMoney(ns){
    return ns.getPlayer().money * settings.totalMoneyAllocation
}

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

/**
 * @typedef {Object} ServerMap
 * @property {Object.<MyServer>} servers
 * @property {number} lastUpdate
 */


/** @param {NS} ns
 * @param {ServerMap} serverMap 
 * @param {string} host */
function updateServer(ns, serverMap, host) {
    serverMap.servers[host] = {
        host,
        ports: ns.getServerNumPortsRequired(host),
        hackingLevel: ns.getServerRequiredHackingLevel(host),
        maxMoney: ns.getServerMaxMoney(host),
        growth: ns.getServerGrowth(host),
        minSecurityLevel: ns.getServerMinSecurityLevel(host),
        baseSecurityLevel: ns.getServerBaseSecurityLevel(host), // can we remove this?
        ram: ns.getServerMaxRam(host),
        connections: ['home'],
        parent: 'home',
        children: [],
    }
    
    Object.keys(serverMap.servers).map((hostname) => {
        if (!ns.serverExists(hostname)) {
            delete serverMap.servers[hostname]
        }
    })
    setItem(SERVER_MAP, serverMap)
}

/** @param {NS} ns */
function getPurchasedServers(ns) {
    let purchasedServers = ns.getPurchasedServers()
    if (purchasedServers.length) {
        purchasedServers.sort((a, b) => {
            const totalRamA = ns.getServerMaxRam(a)
            const totalRamB = ns.getServerMaxRam(b)
            
            if (totalRamA === totalRamB) {
                return ns.getServerMaxRam(a) - ns.getServerMaxRam(b)
            } else {
                return totalRamA - totalRamB
            }
        })
    }
    
    return purchasedServers
}

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting playerServers.js`)
    ns.disableLog("getServerMaxRam");
    ns.disableLog("sleep");
    
    settings.maxGbRam = ns.getPurchasedServerMaxRam()
    settings.maxPlayerServers = ns.getPurchasedServerLimit()
    let hostname = ns.getHostname()
    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }
    
    while (true) {
        let didChange = false
        
        const serverMap = await getServerMap(ns)
        let purchasedServers = getPurchasedServers(ns)
        
        let action = purchasedServers.length < settings.maxPlayerServers ? BUY : UPGRADE
        
        if (action === BUY) {
            let smallestCurrentServer = purchasedServers.length ? ns.getServerMaxRam(purchasedServers[0]) : 0
            let targetRam = Math.max(settings.minGbRam, smallestCurrentServer)
            
            if (targetRam === settings.minGbRam) {
                while (getAvailableMoney(ns) >= targetRam * settings.gbRamCost * settings.maxPlayerServers) {
                    targetRam *= 2
                }
                targetRam /= 2
            }
            
            targetRam = Math.max(settings.minGbRam, targetRam)
            targetRam = Math.min(targetRam, settings.maxGbRam)
            
            if (getAvailableMoney(ns) >= targetRam * settings.gbRamCost) {
                let hostname = `pserv-${targetRam}-${createUUID()}`
                hostname = ns.purchaseServer(hostname, targetRam)
                
                if (hostname) {
                    ns.tprint(`Bought new server: ${hostname} (${targetRam} GB)`)
                    
                    updateServer(ns, serverMap, hostname)
                    didChange = true
                }
            }
        } else {
            let smallestCurrentServer = Math.max(ns.getServerMaxRam(purchasedServers[0]), settings.minGbRam)
            let biggestCurrentServer = ns.getServerMaxRam(purchasedServers[purchasedServers.length - 1])
            let targetRam = biggestCurrentServer
            
            if (smallestCurrentServer === settings.maxGbRam) {
                ns.tprint(`All servers maxxed. Exiting.`)
                ns.exit()
                return
            }
            
            if (smallestCurrentServer === biggestCurrentServer) {
                while (getAvailableMoney(ns) >= targetRam * settings.gbRamCost) {
                    targetRam *= 4
                }
                
                targetRam /= 4
            }
            
            targetRam = Math.min(targetRam, settings.maxGbRam)
            
            purchasedServers = getPurchasedServers(ns)
            if (targetRam > ns.getServerMaxRam(purchasedServers[0])) {
                didChange = true
                while (didChange) {
                    didChange = false
                    purchasedServers = getPurchasedServers(ns)
                    
                    if (targetRam > ns.getServerMaxRam(purchasedServers[0])) {
                        if (getAvailableMoney(ns) >= targetRam * settings.gbRamCost) {
                            let hostname = `pserv-${targetRam}-${createUUID()}`
                            
                            await ns.killall(purchasedServers[0])
                            await ns.sleep(10)
                            const serverDeleted = await ns.deleteServer(purchasedServers[0])
                            if (serverDeleted) {
                                hostname = await ns.purchaseServer(hostname, targetRam)
                                
                                if (hostname) {
                                    ns.tprint(`Upgraded: ${purchasedServers[0]} into server: ${hostname} (${targetRam} GB)`)
                                    ns.print(`Upgraded: ${purchasedServers[0]} into server: ${hostname} (${targetRam} GB)`)
                                    updateServer(ns, serverMap, hostname)
                                    didChange = true
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (!didChange) {
            await ns.sleep(5123)
        }
    }
}
