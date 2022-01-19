import { getPlayerDetails, getServerMap } from 'common.js'

export function printPathToServer(servers, serverToFind) {
    if (serverToFind === 'home') return 'home'
    if (!servers[serverToFind]) return `-- Unable to locate ${serverToFind} --`
    
    const jumps = []
    
    let isParentHome = servers.parent === 'home'
    let currentServer = serverToFind
    
    while (!isParentHome) {
        jumps.push(servers[currentServer].parent)
        
        if (servers[currentServer].parent !== 'home') {
            currentServer = servers[currentServer].parent
        } else {
            isParentHome = true
        }
    }
    jumps.unshift(serverToFind)
    return jumps.reverse().join('; connect ')
}

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting find.js`)
    const serverToFind = ns.args[0]
    
    let hostname = ns.getHostname()
    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }
    
    const serverMap = await getServerMap(ns);
    
    if (serverToFind) {
        if (Object.keys(serverMap.servers).includes(serverToFind)) {
            ns.tprint(`Path to ${serverToFind} found:`)
            ns.tprint(printPathToServer(serverMap.servers, serverToFind))
        } else {
            ns.tprint(`Unable to find the path to ${serverToFind}`)
        }
    } else {
        
        let finalhack = `; hack;`
        ns.tprint(`Aliases:`)
        ns.tprint(`alias rebuy="buy BruteSSH.exe; buy FTPCrack.exe; buy relaySMTP.exe; buy HTTPWorm.exe; buy SQLInject.exe; buy ServerProfiler.exe; buy DeepscanV1.exe; buy DeepscanV2.exe; buy AutoLink.exe"`)
        ns.tprint(`alias rootkit="run BruteSSH.exe;run FTPCrack.exe;run relaySMTP.exe;run HTTPworm.exe;run SQLInject.exe;run NUKE.exe;backdoor"`)
        ns.tprint(`alias csec="${printPathToServer(serverMap.servers, 'CSEC')}${finalhack}"`)
        ns.tprint(`alias nitesec="${printPathToServer(serverMap.servers, 'avmnite-02h')}${finalhack}"`)
        ns.tprint(`alias blackhand="${printPathToServer(serverMap.servers, 'I.I.I.I')}${finalhack}"`)
        ns.tprint(`alias bitrunners="${printPathToServer(serverMap.servers, 'run4theh111z')}${finalhack}"`)
        ns.tprint('')
        ns.tprint(`Common servers:`)
        await doFactionServer(ns, "CSEC", `* CSEC (CyberSec faction)`);
        await doFactionServer(ns, "avmnite-02h", `* avmnite-02h (NiteSec faction)`);
        await doFactionServer(ns, "I.I.I.I", `* I.I.I.I (The Black Hand faction)`);
        await doFactionServer(ns, "run4theh111z", `* run4theh111z (Bitrunners faction)`);
        await doFactionServer(ns, "w0r1d_d43m0n", `* w0r1d_d43m0n`);
        
        ns.tprint('')
        ns.tprint('Buy all hacks command:')
        ns.tprint(`home; connect darkweb; buy BruteSSH.exe; buy FTPCrack.exe; buy relaySMTP.exe; buy HTTPWorm.exe; buy SQLInject.exe; home;`)
        ns.tprint('or just run alias: rebuy')
    }
}

/** @param {NS} ns */
async function doFactionServer(ns, host, msg){
    let finalhack = `; hack;`
    let serverMap = await getServerMap(ns)
    if (!Object.keys(serverMap.servers).includes(host)) {
        ns.print(`ERROR ${host} not found in serverMap`)
        return
    }
    ns.tprint('');
    ns.tprint(msg);
    ns.tprint(`WARN - ${printPathToServer(serverMap.servers, host)}${finalhack}`)
    // checking for root doesn't seem to matter here.  it's possible to have root but still not have the skill level.
    
    const playerDetails = getPlayerDetails(ns)
    let server = serverMap.servers[host];
    let canBeHacked = server.ports <= playerDetails.portHacks && server.hackingLevel <= playerDetails.hackingLevel
    if (canBeHacked) {
        // await hackServer(ns, host)
        // ns.tprint(`INFO ${host} HACKED`)
    } else {
        //TODO: explain what's missing
        ns.tprint(`ERROR ${host} cannot be hacked yet`)
    }
    
}
