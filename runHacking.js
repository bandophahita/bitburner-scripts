// RUN THIS SCRIPT 
// This is the primary script that should be run when kicking off the script after having already downloaded everything.
// It's primary purpose is to run mainHack but also determines if the HOME has enough ram (32 gb)
// to start running playerServers.js too.


// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting runHacking.js`)
    let targetName = ns.args[0] || ""
    let hostname = ns.getHostname()
    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }
    const homeRam = ns.getServerMaxRam('home')
    
    await runIfNotRunning(ns, 'reminders.js')
    
    if (homeRam >= 32) {
        await runIfNotRunning(ns, 'hacknet_buyer.js')
        await runIfNotRunning(ns, 'stocks.js')
        
        ns.tprint(`Running spider.js`)
        await runAsBlocker(ns, 'spider.js')
        
        ns.tprint(`Spawning playerServers.js`)
        ns.run('playerServers.js')
        
        ns.tprint(`Spawning playerServers.js`)
        ns.spawn('mainHack.js', 1, targetName)
        
        
    } else {
        ns.tprint(`Spawning spider.js`)
        await runAsBlocker(ns, 'spider.js')
        
        ns.spawn('mainHack.js', 1, targetName)
    }
}

/** @param {NS} ns */
function runIfNotRunning(ns, fn) {
    if (!ns.isRunning(fn)) {
        ns.tprint(`Spawning ${fn}`)
        ns.run(fn, 1)
    }
}

/** @param {NS} ns */
async function runAsBlocker(ns, fn) {
    // will run a script but is a blocking operation.
    runIfNotRunning(ns, fn)
    await ns.sleep(50);
    while (ns.isRunning(fn)) {
        await ns.sleep(50);
    }
    ns.tprint(`${fn} all done `)
}
