const axios = require("axios").default;
const abi = require("./abi.json");
const {
    Webhook,
    MessageBuilder
} = require('discord-webhook-node');
const {
    getBlockHeight,
    writeBlockHeight
} = require("./blockHandler.js");
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/5ad686d1f5ab4565a30a8ae793e209bc'));
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getLatestBlock() {
    let blockNumber = await web3.eth.getBlockNumber();
    return blockNumber - 2;
}

async function check(fromBlock, toBlock, contractAddress, event) {
    try {
        let myContract = new web3.eth.Contract(abi, contractAddress);
        let events = await myContract.getPastEvents(event, {
            fromBlock: fromBlock,
            toBlock: toBlock
        })
        return events
    } catch (error) {
        console.log(error);
        return "error";
    }

}

function sendToDiscord(details) {

    const hook = new Webhook(details.webhook);
    var embed = new MessageBuilder()
        .setTitle(`New name change`)
        .setURL(`https://opensea.io/assets/0xe0fa9fb0e30ca86513642112bee1cbbaa2a0580d/${details.id}`)
        .addField("ID", `${details.id}`)
        .addField('New name', `${details.newName}`)
        .setColor('#' + Math.floor(Math.random() * 16777215).toString(16))
        .setThumbnail(details.image)
        .setFooter("The greats")
        .setTimestamp();
    console.log(`Sending : NameChange of ${details.id}`);
    hook.send(embed).catch(function (data) {
        console.log(data)
    });
}

async function getImage(id) {
    try {
        let data = await axios.get(`https://api.opensea.io/api/v1/asset/0xe0fa9fb0e30ca86513642112bee1cbbaa2a0580d/${id}`);
        return data.data.image_url
    } catch (error) {
        console.log(error)
        return ""
    }

}
async function start() {
    while (true) {
        let latestBlockNumber = await getLatestBlock();
        let lastCheckedBlock = getBlockHeight();
        if (lastCheckedBlock + 1 < latestBlockNumber) {
            console.log(`Checking blocks range (${lastCheckedBlock +  1}:${latestBlockNumber})`);
            try {
                let eventsHappened = await check(lastCheckedBlock + 1, latestBlockNumber, "0xe0fa9fb0e30ca86513642112bee1cbbaa2a0580d", "NameChange");
                if (eventsHappened !== "error") {
                    for (const eventHappened of eventsHappened) {
                        try {

                            let image_url = await getImage(eventHappened.returnValues.tokenId);
                            sendToDiscord({
                                id: eventHappened.returnValues.tokenId,
                                newName: eventHappened.returnValues.newName,
                                webhook: "https://discord.com/api/webhooks/902235917941628968/",
                                image: image_url
                            });
                        } catch (error) {
                            console.log(error);
                        }

                        await snooze(1000);
                    }
                    writeBlockHeight(latestBlockNumber);
                }

            } catch (error) {
                console.log(error);
            }
        }
        await snooze(10000);
    }
}
start();