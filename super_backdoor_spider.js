// goes through the servers and nukes them.  will try to install backdoor once user has access to SF-4
// note -- the SF-4 dependent code is commented out for now to save on ram.

import { // settings, getItem, setItem, localeHHMMSS, hackPrograms, 
    hackScripts, getPlayerDetails,
    getServerMap,
} from 'common.js'


/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog('sleep')
    ns.disableLog('getHackingLevel')
    ns.print(`-`.repeat(80))
    let hostname = ns.getHostname()
    if (hostname !== 'home') { throw new Error('Run the script from home') }
    await hackAllServers(ns)
}

/** @param {NS} ns */
async function hackAllServers(ns) {
    ns.disableLog('installBackdoor')
    const playerDetails = getPlayerDetails(ns)
    let serverMap = await getServerMap(ns);
    let servers = Object.keys(serverMap.servers);
    
    let nukedServers = ['home']
    let backdoorServers = ['home']
    for (let host of servers) {
        await ns.sleep(30);
        if (host === 'home') continue;
        
        let srv = ns.getServer(host);
        // if (playerDetails.hackingLevel < s.hackingLevel) {
        //     ns.print(`${host} - need hacklevel: ${s.hackingLevel}`)
        //     continue;
        // }
        if (!await canBeHacked(ns, host)) {
            continue
        }
        if (!ns.hasRootAccess(host)) {
            await nukeServer(ns, host);
            // await ns.scp(hackScripts, host);
            ns.tprint(`${host} NUKED`);
            ns.print(`${host} NUKED`);
        } else {
            ns.print(`${host} GOOD`);
            nukedServers.push(host);
        }
        
        if (!srv.backdoorInstalled) {
            // can't do this without SF-4 
            // try {
            //     await ns.installBackdoor(host);
            //     backdoorServers.push(host);
            //     ns.tprint(`${host} backdoor installed`);
            // } catch (err) {
            //     ns.print(`${host} NEEDS BACKDOOR`)
            // }
        } else {
            backdoorServers.push(host);
        }
    }
    ns.print("loop finished");
    ns.print(`${servers.length} servers`);
    ns.tprint(`${nukedServers.length}/${servers.length} servers nuked`);
    ns.tprint(`${backdoorServers.length}/${servers.length} servers backdoor installed`);
}

/** @param {NS} ns
 * @param {string} host
 */
async function canBeHacked(ns, host) {
    let serverMap = await getServerMap(ns);
    let server = serverMap.servers[host];
    if (!ns.serverExists(host)) throw new Error(`unknown server: ${host}`)
    const playerDetails = getPlayerDetails(ns)
    let portsHackable = server.ports <= playerDetails.portHacks;
    let haveSkill = server.hackingLevel <= playerDetails.hackingLevel
    if (!portsHackable) {
        ns.print(`${host.padEnd(20, " ")}  ${playerDetails.portHacks}/${server.ports} ports`)}
    if (!haveSkill) {
        ns.print(`${host.padEnd(20, " ")}  ${playerDetails.hackingLevel}/${server.hackingLevel} hackLevel`)}
    let rt = portsHackable && haveSkill
    return rt
}

/** @param {NS} ns */
async function nukeServer(ns, host) {
    let serverMap = await getServerMap(ns);
    ns.print(`${host} - nuking`);
    let nPortsNeeded = serverMap.servers[host].ports
    if (nPortsNeeded >= 5) {
        ns.print('${host} SQLinject')
        await ns.sqlinject(host)
    }
    if (nPortsNeeded >= 4) {
        ns.print('${host} HTTPworm')
        await ns.httpworm(host)
    }
    if (nPortsNeeded >= 3) {
        ns.print('${host} relaySMTP')
        await ns.relaysmtp(host)
    }
    if (nPortsNeeded >= 2) {
        ns.print('${host} FTPcrack')
        await ns.ftpcrack(host)
    }
    if (nPortsNeeded >= 1) {
        ns.print('${host} BruteSSH')
        await ns.brutessh(host)
    }
    await ns.nuke(host);
    await ns.scp(hackScripts, host);
}
