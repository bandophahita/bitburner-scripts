import { getServerMap, } from 'common.js'

const scriptsToKill = [
    'mainHack.js',
    'spider.js',
    'grow.js',
    'hack.js',
    'weaken.js',
    'playerServers.js',
    'runHacking.js',
    'initHacking.js',
    'start.js',
    'find.js',
]

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting killAll.js`)
    const scriptToRunAfter = ns.args[0]
    
    if (ns.getHostname() !== 'home') {throw new Exception('Run the script from home')}
    
    let serverMap = await getServerMap(ns)
    
    for (let i = 0; i < scriptsToKill.length; i++) {
        ns.scriptKill(scriptsToKill[i], 'home')
    }
    
    const killAbleServers = Object.keys(serverMap.servers)
        .filter((hostname) => ns.serverExists(hostname))
        .filter((hostname) => hostname !== 'home')
    
    for (let i = 0; i < killAbleServers.length; i++) {
        let server = killAbleServers[i]
        // await ns.killall(server) 
        // this will only kill the scripts we intend to.
        for (let script of scriptsToKill) {
            ns.scriptKill(script, server)
        }
    }
    
    ns.tprint(`All processes killed`)
    
    if (scriptToRunAfter) {
        const targetName = ns.args[1] || ""
        //ns.tprint(`${targetName} in killAll`)
        ns.tprint(`Spawning ${scriptToRunAfter}`)
        ns.spawn(scriptToRunAfter, 1, targetName)
    }
}
