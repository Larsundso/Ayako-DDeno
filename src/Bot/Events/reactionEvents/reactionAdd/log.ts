import type * as DDeno from 'discordeno';
import type CT from '../../../Typings/CustomTypings';
import client from '../../../BaseClient/DDenoClient.js';

export default async (reaction: CT.ReactionAdd) => {
  if (!reaction.guildId) return;

  const channels = await client.ch.getLogChannels('reactionevents', { guildId: reaction.guildId });
  if (!channels) return;

  const guild = await client.cache.guilds.get(reaction.guildId);
  if (!guild) return;

  const user = await client.cache.users.get(reaction.userId);
  if (!user) return;

  const msg = await client.cache.messages.get(reaction.messageId);
  if (!msg) return;

  const language = await client.ch.languageSelector(reaction.guildId);
  const lan = language.events.logs.reaction;
  const con = client.customConstants.events.logs.reaction;
  const files: DDeno.FileContent[] = [];

  const embed: DDeno.Embed = {
    author: {
      iconUrl: con.create,
      name: lan.nameAdd,
    },
    description: lan.descAdded(reaction.emoji, user, msg),
    fields: [],
    color: client.customConstants.colors.success,
  };

  if (msg.reactions?.length) {
    embed.fields?.push({
      name: lan.reactions,
      value: msg.reactions
        ?.map(
          (r) =>
            `\`${client.ch.spaces(`${r.count}`, 5)}\` ${
              reaction.emoji.id === r.emoji.id ||
              (!reaction.emoji.id && reaction.emoji.name === r.emoji.name)
                ? ` ${client.stringEmotes.plusBG}`
                : ` ${client.stringEmotes.invis}`
            } ${language.languageFunction.getEmote(r.emoji)}`,
        )
        .join('\n'),
    });
  }

  if (reaction.emoji.toggles.requireColons && reaction.emoji.id) {
    embed.thumbnail = {
      url: `attachment://${reaction.emoji.name ?? reaction.emoji.id}`,
    };

    const attachment = (
      await client.ch.fileURL2Blob([
        client.helpers.getEmojiURL(reaction.emoji.id, reaction.emoji.toggles.animated),
      ])
    ).filter(
      (
        e,
      ): e is {
        blob: Blob;
        name: string;
      } => !!e,
    );

    if (attachment) files.push(...attachment);
  }

  await client.ch.send(
    { id: channels, guildId: reaction.guildId },
    { embeds: [embed], files },
    language,
    undefined,
    10000,
  );
};
