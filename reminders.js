// import { localeHHMMSS, getItem, setItem, getPlayerDetails, hackPrograms, hackScripts, createUUID } from 'common.js'


const WARN = 'warning';
const ERROR = 'error';
const GOOD = 'success';
const INFO = 'info';
const WAKE_TIME = 1000 * 20;  // 10 seconds
const TOAST_TIME = 1000 * 10; // 10 seconds

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("sleep");
    
    let hostname = ns.getHostname()
    if (hostname !== 'home') throw new Exception('Run the script from home')
    
    while (true) {
        await checkDarkWeb(ns);
        //await checkFactions(ns)
        await activelyWorking(ns);
        ns.run("contract_solver.js")
        
        await ns.sleep(WAKE_TIME)
    }
}


/** @param {NS} ns
 * @param {String} msg 
 * @param {String} lvl
 */
function remind(ns, msg, lvl=ERROR) {
    let m = `[REMINDER] ${msg}`
    ns.tprintf(`${lvl.toUpperCase()} ${m}`)
    ns.toast(m, lvl, TOAST_TIME)
}

/** @param {NS} ns */
async function checkDarkWeb(ns) {
    let me = ns.getPlayer()
    
    // BUY TOR ROUTER (gives access to DARKWEB)
    if (!me.tor) {
        if (me.money > 200000) {
            remind(ns, `Buy Tor Router`)
        }
    } else {
        // DID WE FULLY HACK DARKWEB? 
        // PROGRAMS TO BUY ON DARKWEB 
        let cost = {
            'BruteSSH.exe': 500000,
            'FTPCrack.exe': 1500000,
            'relaySMTP.exe': 5000000,
            'HTTPWorm.exe': 30000000,
            'SQLInject.exe': 250000000,
            'Formulas.exe': 5000000000,
        }
        for (let program of Object.keys(cost)) {
            if (!ns.fileExists(program, 'home')) {
                if (me.money > cost[program]) {
                    remind(ns, `Buy ${program} @ $${ns.nFormat(cost[program], '0.0a')}`)
                }
            }
        }
    }
    /* 
    ServerProfiler.exe - $500.000k - Displays detailed information about a server.
    DeepscanV1.exe - $500.000k - Enables 'scan-analyze' with a depth up to 5.
    DeepscanV2.exe - $25.000m - Enables 'scan-analyze' with a depth up to 10.
    AutoLink.exe - $1.000m - Enables direct connect via 'scan-analyze'.
    */
    
    // upgrade RAM
    // upgrade CPU
}

/** @param {NS} ns */
async function activelyWorking(ns){
    if (!ns.getPlayer().isWorking){
        remind(ns, `YOU ARE CURRENTLY NOT WORKING`, WARN)
    }
}

/** @param {NS} ns */
async function checkFactions(ns) {
    // cant do any of this until we have bitnode 4
    // ARE WE CURRENTLY BUILDING FACTION REP? 
    let fac = ["Daedalus", "BitRunners", "The Black Hand", 'Nitesec', 'Sector-12', 'Tian Di Hui']
    let work = ['hacking', 'hacking', 'hacking', 'hacking', 'hacking', 'hacking']
    let repgoal = [2500000, 1000000, 125000, 50000, 50000, 6250]
    let factions = {
        "Daedalus" : {
            'goal': 2500000,
            
        }
    }
}
// need to check each requirement to join factions
/* 

[Early-game factions]

CyberSec	
    Hack CSEC manually
Tian Di Hui	
    $1,000,000
    Hacking 50
    Be in Chongquin, New Tokyo, or Ishima
Netburners
    Hacking 80
    Total Hacknet levels 100
    Total Hacknet RAM 8
    Total Hacknet Cores 4

[City factions]

Sector-12	
    Be in Sector-12
    $15,000,000
Chongquin	
    Be in Chongquin
    $20,000,000
    Not in city factions Sector-12, Aevum, or Volhaven
New Tokyo	
    Be in New Tokyo
    $20,000,000
    Not in city factions Sector-12, Aevum, or Volhaven
Ishima	
    Be in Ishima
    $30,000,000
    Not in city factions Sector-12, Aevum, or Volhaven
Aevum	
    Be in Aevum
    $40,000,000
Volhaven	
    Be in Volhaven
    $50,000,000
    Not in any other city faction

[Hacker groups]

NiteSec	
    Hack avmnite-02h manually
    Home RAM at least 32
The Black Hand	
    Hack I.I.I.I manually
    Home RAM of 64 GB
BitRunners	
    Hack run4theh111z manually
    Home RAM of 128 GB

[Megacorporations]

MegaCorp	
    Work for MegaCorp
    At least 200,000 reputation
Blade Industries	
    Work for Blade Industries
    At least 200,000 reputation
Four Sigma	
    Work for Four Sigma
    At least 200,000 reputation
KuaiGong International	
    Work for KuaiGong International
    At least 200,000 reputation
NWO	
    Work for NWO
    At least 200,000 reputation
OmniTek Incorporated	
    Work for OmniTek Incorporated
    At least 200,000 reputation
ECorp	
    Work for ECorp
    At least 200,000 reputation
Bachman & Associates	
    Work for Backman & Associates
    At least 200,000 reputation
Clarke Incorporated	
    Work for Clarke Incorporated
    At least 200,000 reputation
Fulcrum Secret Technologies	
    Work for Fulcrum Technologies
    At least 200,000 reputation
    Hack fulcrumassets manually


*/
// }
