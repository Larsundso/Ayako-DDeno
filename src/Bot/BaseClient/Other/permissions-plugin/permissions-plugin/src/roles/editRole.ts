
import { higherRolePosition, highestRole, requireBotGuildPermissions } from "../permissions";
import { Bot } from "discordeno";
import { BotWithProxyCache, ProxyCacheTypes } from "../../..";
export function editRole<B extends Bot>(
    bot: BotWithProxyCache<ProxyCacheTypes, B>
  ) {
  const editRole = bot.helpers.editRole;

  bot.helpers.editRole = async function (
    guildId,
    id,
    options,
  ) {
    const guild = bot.cache.guilds.memory.get(bot.transformers.snowflake(guildId));
    if (guild) {
      const role = guild.roles.get(bot.transformers.snowflake(id));
      if (role) {
        const botRole = highestRole(bot, guild, bot.id);

        if (!higherRolePosition(bot, guild, botRole.id, role.id)) {
          throw new Error(
            `The bot can not add this role to the member because it does not have a role higher than the role ID: ${role.id}.`,
          );
        }
      }

      requireBotGuildPermissions(bot, guild, ["MANAGE_ROLES"]);
    }

    if (options.name && !bot.utils.validateLength(options.name, { max: 100 })) {
      throw new Error("Role name must be less than 100 characters");
    }

    return await editRole(guildId, id, options);
  };
}
