import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits, IntentsBitField} from 'discord.js'; //imports discord.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from 'discord.js'; //imports discord.js
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import {PcSpecsScraper, GameReqsScraper} from "./lib/scraper.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { log } from "console";
dotenv.config();

//Dvision symbols -  or  /  |  ,  
// PcSpecsScraper();
// GameReqsScraper();

const supabase = createClient(process.env.DB_URL, process.env.PUBLIC_ANON_KEY);
const cpuData =await supabase.from("Cpuspecs").select();
// console.log(cpuData.data);
const gpuData =await supabase.from("Gpuspecs").select();
// console.log(gpuData.data);
const minSpecs =await supabase.from("GameMinSpecs").select();
// console.log(minSpecs.data);
const gpuNames=[];
gpuData.data.forEach(element => {
  gpuNames.push(element.name);
});


const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers,
	// IntentsBitField.Flags.GuildIntegrations,
	GatewayIntentBits.GuildIntegrations,
  ],
}); //creates new client

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
// client.once(Events.ClientReady, readyClient => {
// 	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
// });


client.commands = new Collection();
const foldersPath = path.join('./commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import ("./"+filePath);
		// console.log(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			// console.log(client.commands.get("ping"));
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on("messageCreate",(msg)=>{
	console.log(msg.content);
})

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});



// client.on('messageCreate',(msg)=>{
//   if(!msg.author.bot){
//     if(msg.content==="can i run it")
//     {
//       const select=new StringSelectMenuBuilder()
//         .setCustomId('starter')
//         .setPlaceholder("Choose")
//         .addOptions(
//           new StringSelectMenuOptionBuilder()
// 			  		.setLabel('Bulbasaur')
// 			  		.setDescription('The dual-type Grass/Poison Seed Pokémon.')
// 			  		.setValue('bulbasaur'),
// 			  	new StringSelectMenuOptionBuilder()
// 			  		.setLabel('Charmander')
// 			  		.setDescription('The Fire-type Lizard Pokémon.')
// 			  		.setValue('charmander'),
// 			  	new StringSelectMenuOptionBuilder()
// 			  		.setLabel('Squirtle')
// 			  		.setDescription('The Water-type Tiny Turtle Pokémon.')
// 			  		.setValue('squirtle'),
//         );
      
//       msg.reply(select);
//     }
//   }
// });


// client.on('messageCreate', (msg) => {
//   if( !msg.author.bot)
//   {
//     if(msg.content.length>20)
//     {
//         const message=msg.content.split(/\n/g);
//         console.log(message);
//         let min=1e9,min2;
//         let compData={
//           gameName:"",
//           userCpu:"",
//           userCpuSingleCoreScore:0,
//           userCpuMultiCoreScore:0,
//           userGpu:"",
//           userGpuScore:0,
//           userRam:0,
//           minReqCpu:"",
//           minReqCpuSingleCoreScore:0,
//           minReqCpuMultiCoreScore:0,
//           minReqGpu:"",
//           minReqGpuScore:0,
//           minReqRam:0,
//         }

//         minSpecs.data.forEach(element => {
//           const temp=element.name.trim();
//           // const d=levenshteinDistance(temp.toLowerCase(),message[0].trim().toLowerCase());
//           const d=levenshteinDistance(temp.toLowerCase(),message[0].trim().toLowerCase());
//           if(min>d)
//           {
//             min=d;
//             compData.gameName=element.name;
//             compData.minReqCpu=element.cpu;
//             compData.minReqGpu=element.gpu;
//             compData.minReqRam=element.ram;
//           }
//         });

//         // matching cpu name and finding score
//         min=1e9, min2=1e9;
//         let minreqcpu="",minreqgpu="";
//         cpuData.data.forEach(element=>{
//           const temp=element.name.trim();
//           const dGame=levenshteinDistance(temp.toLowerCase(),compData.minReqCpu.trim().toLowerCase());
//           const dUser=levenshteinDistance(temp.toLowerCase(),message[1].trim().toLowerCase());
//           if(min>dGame)
//           {
//             min=dGame;
//             minreqcpu=element.name;
//             compData.minReqCpuSingleCoreScore=element.singleCoreScore;
//             compData.minReqCpuMultiCoreScore=element.multiCoreScore;
//           }
//           if(min2>dUser)
//           {
//             min2=dUser;
//             compData.userCpu=element.name;
//             compData.userCpuSingleCoreScore=element.singleCoreScore;
//             compData.userCpuMultiCoreScore=element.multiCoreScore;
//           }
//         });
//         //matching gpu name and finding score 
//         min=1e9,min2=1e9;
//         gpuData.data.forEach(element=>{
//           const temp=element.name//.trim();
//           const dGame=levenshteinDistance(temp.toLowerCase(),compData.minReqGpu.trim().toLowerCase());
//           const dUser=levenshteinDistance(temp.toLowerCase(),message[2].trim().toLowerCase());
//           // const v1 = vectorizer.vectorize(temp.toLowerCase());
//           // const v2 = vectorizer.vectorize(compData.minReqGpu.trim().toLowerCase());
//           // console.log(v1);
//           // console.log(v2);
//           // const similarity = cosineSimilarity(v1,v2);
//           // console.log(temp+" & "+compData.minReqGpu.trim().toLowerCase()+" = "+similarity.toFixed(3));
//           if(min>dGame)
//           {
//             min=dGame;
//             minreqgpu=element.name;
//             compData.minReqGpuScore=element.score;
//           }
//           if(min2>dUser)
//           {
//             min2=dUser;
//             compData.userGpu=element.name;
//             compData.userGpuScore=element.score;
//           }
//         });
//         console.log(compData);
//         console.log(minreqcpu);
//         console.log(minreqgpu);
//     }
//     else
//     {
//         msg.reply("Enter a valid msg");
//     }
//   }  
//     // if(msg.content === "ping"){
//     //   msg.reply("pong");
//     // }
// });



// this line must be at the very end
client.login(process.env.CLIENT_TOKEN); //signs the bot in with token