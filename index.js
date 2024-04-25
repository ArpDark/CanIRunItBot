import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from 'discord.js'; //imports discord.js
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import {PcSpecsScraper, GameReqsScraper} from "./lib/scraper.js";
dotenv.config();

// PcSpecsScraper();
// GameReqsScraper();

const supabase = createClient(process.env.DB_URL, process.env.PUBLIC_ANON_KEY);

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
  ],
}); //creates new client

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.on('messageCreate', (msg) => {
    if(msg.content.length>20)
    {
        const message=msg.content.split(/\n/g);
        console.log(message);
        console.log(msg.content.length);
    }
    else
    {
        msg.reply("Enter a valid msg");
    }
});

// this line must be at the very end
client.login(process.env.CLIENT_TOKEN); //signs the bot in with token