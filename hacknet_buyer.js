// automatically buy and upgrade hacknet nodes


const TOTALMONEYALLOCATION = 0.05 // 2%

function getAvailableMoney(ns){
    return ns.getPlayer().money * TOTALMONEYALLOCATION
}

/** @param {NS} ns */
export async function main(ns) {
    let delayTime = ns.args[0] || 1000;
    
    ns.disableLog("sleep");
    let upgradeTypes = ["LVL", "RAM", "CPU"];
    
    let mention = true
    while (true) {
        let ownedNodes = ns.hacknet.numNodes();
        let minValue = ns.hacknet.getPurchaseNodeCost();
        let nodeIndex = ownedNodes;
        let upgradeType = -1; //-1 -> purchase, 0 -> level, 1 -> ram, 2 -> core
        let upgradeTypeStr = "";
        
        for (let i = 0; i < ownedNodes; i++) {
            let upgrades = [
                ns.hacknet.getLevelUpgradeCost(i, 1),
                ns.hacknet.getRamUpgradeCost(i, 1),
                ns.hacknet.getCoreUpgradeCost(i, 1),
            ];
            
            let value = Math.min.apply(Math, upgrades);
            if (value < minValue) {
                minValue = value;
                nodeIndex = i;
                upgradeType = upgrades.indexOf(value);
                upgradeTypeStr = upgradeTypes[upgradeType];
                mention = true;
            }
        }
        if (mention){
            ns.print(`Cheapest is ${nodeIndex} ${upgradeTypeStr} cost: $${ns.nFormat(minValue, "0.0a")}`);
        }
        
        
        if (getAvailableMoney(ns) < minValue) {
            if (mention) {
                ns.print(`Only allowed to spend $${ns.nFormat(getAvailableMoney(ns), "0.0a")}`)
                ns.print(`Waiting till we have $${ns.nFormat(minValue / TOTALMONEYALLOCATION, "0.0a")}`)
                mention = false;
            }
            await ns.sleep(delayTime);
            continue;
        } else {
            mention = true
        }
        
        switch (upgradeType) {
            case -1:
                ns.hacknet.purchaseNode();
                ns.print("buying node");
                break;
            case 0:
                ns.hacknet.upgradeLevel(nodeIndex, 1);
                ns.print(`Purchasing LVL Upgrade for Node: ${nodeIndex}`);
                break;
            case 1:
                ns.hacknet.upgradeRam(nodeIndex, 1);
                ns.print(`Purchasing RAM Upgrade for Node: ${nodeIndex}`);
                break;
            case 2:
                ns.hacknet.upgradeCore(nodeIndex, 1);
                ns.print(`Purchasing CPU Upgrade for Node: ${nodeIndex}`);
                break;
        }
        await ns.sleep(1);
    }
}
