/*
Don't be cringe and resell or pass it off as your own
*/

// Used packages
const mineflayer = require("mineflayer");
const chalk = require("chalk");
const yaml = require("js-yaml");
const fs = require("fs");

// Naming the process
process.title = "Dutched's Auto Adjust Bot 1.0.0";

// Epic welcomescreen
console.log(
  chalk.white(" ────────────────────────────────────────────────────────────")
);
console.log(
  chalk.white(
    `  [${chalk.greenBright(
      "+"
    )}] Dutched's Auto Adjust Bot ${chalk.magentaBright(`1.0.0`)}`
  )
);
console.log(
  chalk.white(
    `  [${chalk.greenBright("+")}] Discord: ${chalk.magentaBright(
      `https://discord.gg/KhHSVVARuC`
    )}`
  )
);
console.log(chalk.white(`  [${chalk.redBright("!")}] This is a free program`));
console.log(
  chalk.white(" ────────────────────────────────────────────────────────────")
);

// Plugins
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;
const { GoalGetToBlock } = require("mineflayer-pathfinder").goals;

// Loading config
let config = yaml.load(fs.readFileSync(`${process.cwd()}/config.yaml`, "utf8"));

const wait = (waitTimeInMs) =>
  new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

// Variables used later
let adjustTrapdoor;
let activeTrapdoor;
let adjusted = false;

// Creating the bot (Mojang accounts don't work anymore)
let bot;
bot = mineflayer.createBot({
  auth: "microsoft",
  host: config.minecraft.serverIP,
  port: config.minecraft.serverPort,
  version: config.minecraft.version,
  hideErrors: config.minecraft.hideErrors,
});

// Loading and settings for the pathfinder package
bot.loadPlugin(pathfinder);
const defaultMove = new Movements(bot);
defaultMove.allow1by1towers = false;
defaultMove.canDig = false;

// Events
bot.once("login", () => {
  bot.settings.viewDistance = "far";
  console.log(`  [${chalk.hex("#00FF00").bold("Login")}]: ${bot.username}`);
  wait(config.settings.joinCommandDelay * 1000).then(() => {
    bot.chat(config.minecraft.joinCommand);
  });
});

bot.on("error", (e) => {
  if (e === undefined) return;
  console.log(e);
});

bot.on("end", (e) => {
  if (e === undefined) return;
  console.log(e);
});

bot.on("goal_reached", async (goal) => {
  if (activeTrapdoor) {
    if (activeTrapdoor.position.y != goal.y && adjusted) {
      await bot.activateBlock(activeTrapdoor);
      adjusted = false;
    }
  }

  if (goal.y === adjustTrapdoor.position.y && !adjusted) {
    await bot.activateBlock(adjustTrapdoor);
    activeTrapdoor = adjustTrapdoor;
    adjusted = true;
    return bot.pathfinder.setGoal(new GoalGetToBlock(activeTrapdoor));
  }
});

// Commands
bot.on("message", async (message) => {
  let chat = message.toString();
  if (chat.length < 1 || chat == undefined) return;
  if (!chat.includes(config.settings.prefix)) return;

  let chatSplit = chat.split("!");

  if (!chat.includes(config.settings.prefix) && !chat.includes("me")) return;

  const commandSplit = chatSplit[1].toLowerCase().split(" ");

  const command = commandSplit[0].toLowerCase();

  switch (command) {
    case "tpa":
      bot.chat(`/tpa ${commandSplit[1]}`);
      break;

    case "adjust":
      bot.findBlocks({
        point: bot.entity.position,
        maxDistance: config.settings.maxDistance,
        matching: async (block) => {
          if (
            block.type === 96 &&
            block.position.y === parseInt(commandSplit[1])
          ) {
            if (!block._properties.powered)
              return bot.chat(
                `/r We are already shooting at y${commandSplit[1]}`
              );
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(
              new GoalGetToBlock(
                block.position.x,
                block.position.y,
                block.position.z
              )
            );
            adjustTrapdoor = block;
            if (config.settings.useChat)
              bot.chat(`/r Adjusting to y${commandSplit[1]}`);
          }
        },
      });
      break;

    case "current":
      bot.chat(`/r Current y: ${activetrapdoor.position.y}`);
      break;

    case "sudo":
      bot.chat(`/${commandSplit[1]}`);
      break;
  }
});