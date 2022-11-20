
import { Bot } from "discordeno";
import { BotWithProxyCache, ProxyCacheTypes } from "../../..";
export function editGuildMfaLevel<B extends Bot>(
    bot: BotWithProxyCache<ProxyCacheTypes, B>
  ) {
  const editGuildMfaLevel = bot.helpers.editGuildMfaLevel;

  bot.helpers.editGuildMfaLevel = async function (guildId, mfaLevel, reason) {
    const guild = bot.cache.guilds.memory.get(bot.transformers.snowflake(guildId));
    if (guild?.ownerId !== bot.id) throw new Error("The bot is not the owner of the guild");
    return await editGuildMfaLevel(guildId, mfaLevel, reason);
  };
}