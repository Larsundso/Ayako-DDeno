import { requireBotChannelPermissions } from "../../permissions";
import { Bot } from "discordeno";
import { BotWithProxyCache, ProxyCacheTypes } from "../../../..";
export function deleteReactionsEmoji<B extends Bot>(
    bot: BotWithProxyCache<ProxyCacheTypes, B>
  ) {
  const deleteReactionsEmoji = bot.helpers.deleteReactionsEmoji;

  bot.helpers.deleteReactionsEmoji = async function (channelId, messageId, reaction) {
    requireBotChannelPermissions(bot, bot.transformers.snowflake(channelId), ["MANAGE_MESSAGES"]);

    return await deleteReactionsEmoji(channelId, messageId, reaction);
  };
}