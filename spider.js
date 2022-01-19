// Crawls through each server and attempts to get into servers available
// uses 3.20GB RAM
import { setItem, getPlayerDetails, SERVER_MAP} from 'common.js'

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting spider.js`)
    let hostname = ns.getHostname()
    
    if (hostname !== 'home') throw new Exception('Run the script from home')
    
    const serverMap = { servers: { home : {}}, lastUpdate: new Date().getTime() }
    const scanArray = ['home']
    
    while (scanArray.length) {
        const host = scanArray.shift()
        
        serverMap.servers[host] = {
            host,
            ports: ns.getServerNumPortsRequired(host),
            hackingLevel: ns.getServerRequiredHackingLevel(host),
            maxMoney: ns.getServerMaxMoney(host),
            growth: ns.getServerGrowth(host),
            minSecurityLevel: ns.getServerMinSecurityLevel(host),
            baseSecurityLevel: ns.getServerBaseSecurityLevel(host),
            ram: ns.getServerMaxRam(host),
            files: ns.ls(host),
        }
        
        if (!ns.hasRootAccess(host)) {
            const playerDetails = getPlayerDetails(ns)
            let server = serverMap.servers[host];
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
        
        const connections = ns.scan(host) || ['home']
        serverMap.servers[host].connections = connections
        
        connections.filter((hostname) => !serverMap.servers[hostname]).forEach((hostname) => scanArray.push(hostname))
    }
    
    let hasAllParents = false
    
    while (!hasAllParents) {
        hasAllParents = true
        
        Object.keys(serverMap.servers).forEach((hostname) => {
            const server = serverMap.servers[hostname]
            
            if (!server.parent) hasAllParents = false
            
            if (hostname === 'home') {
                server.parent = 'home'
                server.children = server.children ? server.children : []
            }
            
            if (hostname.includes('pserv-')) {
                server.parent = 'home'
                server.children = []
                
                if (serverMap.servers[server.parent].children) {
                    serverMap.servers[server.parent].children.push(hostname)
                } else {
                    serverMap.servers[server.parent].children = [hostname]
                }
            }
            
            if (!server.parent) {
                if (server.connections.length === 1) {
                    server.parent = server.connections[0]
                    server.children = []
                    
                    if (serverMap.servers[server.parent].children) {
                        serverMap.servers[server.parent].children.push(hostname)
                    } else {
                        serverMap.servers[server.parent].children = [hostname]
                    }
                } else {
                    if (!server.children) {
                        server.children = []
                    }
                    
                    if (server.children.length) {
                        const parent = server.connections.filter((hostname) => !server.children.includes(hostname))
                        
                        if (parent.length === 1) {
                            server.parent = parent.shift()
                            
                            if (serverMap.servers[server.parent].children) {
                                serverMap.servers[server.parent].children.push(hostname)
                            } else {
                                serverMap.servers[server.parent].children = [hostname]
                            }
                        }
                    }
                }
            }
        })
    }
    
    setItem(SERVER_MAP, serverMap)
    ns.tprint(`spider.js FINISHED!`)
    if (ns.args[0] == '-v') {
        ns.tprint(JSON.stringify(serverMap, undefined, 2))
    }
    
}
