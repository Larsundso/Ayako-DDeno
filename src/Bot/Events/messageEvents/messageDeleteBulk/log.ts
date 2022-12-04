import type * as DDeno from 'discordeno';
import client from '../../../BaseClient/DDenoClient.js';

export default async (msgs: DDeno.Message[]) => {
  const identMsg = msgs[0];
  if (!identMsg.guildId) return;

  const guild = await client.cache.guilds.get(identMsg.guildId);
  if (!guild) return;

  const channels = await client.ch.getLogChannels('messageevents', identMsg);
  if (!channels) return;

  const language = await client.ch.languageSelector(guild.id);
  const lan = language.events.messageDeleteBulk;
  const con = client.customConstants.events.messageDeleteBulk;
  const audit = await client.ch.getAudit(guild, 73, identMsg.channelId);

  const embed: DDeno.Embed = {
    type: 'rich',
    author: {
      name: lan.title,
      iconUrl: con.image,
    },
    color: con.color,
    fields: [],
  };

  if (audit) {
    embed.description = client.ch.stp(lan.descDetails, {
      user: audit.userId ? await client.cache.users.get(audit.userId) : language.unknown,
      channel: await client.cache.channels.get(identMsg.channelId),
      amount: msgs.length,
    });

    if (audit.reason) embed.fields?.push({ name: language.reason, value: audit.reason });
  } else {
    embed.description = client.ch.stp(lan.desc, {
      channel: guild.channels.get(identMsg.channelId),
      amount: msgs.length,
    });
  }

  const getFirstFiles = () => {
    const attachments: DDeno.FileContent[] = [];

    const embedCodes = `${language.Embeds}:${msgs
      .map(
        (m) =>
          'embeds' in m &&
          `${client.ch.stp(client.customConstants.standard.discordUrlDB, {
            guildid: m.guildId,
            channelid: m.channelId,
            msgid: m.id,
          })}\n${m.embeds?.map((e) => `${JSON.stringify(e, null, 2)}`).join('\n')}`,
      )
      .join('\n\n')}`;
    if (msgs.map((m) => ('embeds' in m ? m.embeds : [])).flat(1).length) {
      attachments.push({
        name: 'Embeds.txt',
        blob: new Blob([embedCodes], { type: 'text/plain' }),
      });
    }

    const contents = msgs
      .map(
        (msg) =>
          `${client.ch.stp(lan.log, {
            msg,
            jumpLink: client.ch.stp(client.customConstants.standard.discordUrlDB, {
              guildid: msg.guildId,
              channelid: msg.channelId,
              msgid: msg.id,
            }),
            createdTime: new Date(client.ch.getUnix(msg.id)).toDateString(),
            author: {
              id: 'author' in msg ? msg.authorId : language.unknown,
              tag:
                'author' in msg &&
                'discriminator' in (msg.author as DDeno.User) &&
                'username' in (msg.author as DDeno.User)
                  ? `${(msg.author as DDeno.User).username}#${
                      (msg.author as DDeno.User).discriminator
                    }`
                  : language.unknown,
            },
            embedLength: 'embeds' in msg ? String(msg.embeds.length) : '0',
            attachmentsLength: 'attachments' in msg ? String(msg.attachments.length) : '0',
            content: 'content' in msg && msg.content ? msg.content : lan.noContent,
          })}`,
      )
      .join('\n\n');

    if (msgs.map((m) => ('content' in m ? m.content : null)).flat(1).length) {
      attachments.push({
        name: 'Contents.txt',
        blob: new Blob([contents], { type: 'text/plain' }),
      });
    }

    return attachments;
  };

  const getSecondFiles = async () => {
    if (!msgs.map((m) => ('attachments' in m ? m.attachments : [])).flat(1).length) {
      return [];
    }

    return getAllAttachments(msgs);
  };

  const secondMsgFiles = await getSecondFiles();
  const firstMsgFiles = getFirstFiles();

  const m = await client.ch.send(
    { id: channels, guildId: identMsg.guildId },
    { embeds: [embed], files: firstMsgFiles },
    language,
    undefined,
    secondMsgFiles.length ? undefined : 10000,
  );

  if (!m) return;
  if (!secondMsgFiles.length) return;

  await Promise.all(await Promise.all(secondMsgFiles.map((p) => Promise.all(p))));

  m.forEach(async (message) => {
    if (!message) return;

    const noticeEmbed: DDeno.Embed = {
      description: client.ch.stp(lan.attachmentsLog, { jumpLink: client.ch.getJumpLink(message) }),
      color: client.customConstants.colors.ephemeral,
    };

    let noticeEmbed2: DDeno.Embed | undefined;

    const promises = await Promise.all(
      secondMsgFiles.map((attachments) => {
        const attachmentsToSend = attachments.filter((f) => !!f);

        if (!attachmentsToSend.length) return null;
        if (!message.channelId) return null;
        if (!identMsg.guildId) return null;

        return client.ch.send(
          { id: message.channelId, guildId: identMsg.guildId },
          {
            embeds: [noticeEmbed],
            files: attachmentsToSend,
          },
          language,
        );
      }),
    );

    promises.forEach((m2) => {
      if (!m2) return;

      noticeEmbed2 = {
        type: 'rich',
        description: client.ch.stp(lan.deleteLog, { jumpLink: client.ch.getJumpLink(m2) }),
        color: client.customConstants.colors.ephemeral,
      };
    });

    if (!noticeEmbed2) return;

    client.helpers
      .editMessage(message.channelId, message.id, { embeds: [embed, noticeEmbed2] })
      .catch(() => null);
  });
};

const getAllAttachments = async (
  msgs: (DDeno.Message | { id: string; guildID: string; channel: { id: string } })[],
) => {
  const returnable: DDeno.FileContent[][] = [];
  await new Promise((res) => {
    let finishedIndex = 0;

    msgs.map(async (m, i) => {
      if ('attachments' in m) {
        const attachment = (await client.ch.fileURL2Buffer(m.attachments.map((a) => a.url))).filter(
          (a) => !!a,
        );
        if (attachment !== null) returnable.push(attachment as DDeno.FileContent[]);
      }
      finishedIndex = i;
      if (finishedIndex === msgs.length - 1) res(true);
    });
  });

  return returnable;
};
