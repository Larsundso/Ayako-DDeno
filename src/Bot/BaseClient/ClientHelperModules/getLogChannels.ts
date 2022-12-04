import type * as DDeno from 'discordeno';
import type DBT from '../../Typings/DataBaseTypings';
import type CT from '../../Typings/CustomTypings';
import client from '../DDenoClient.js';

export default async (
  columnName:
    | 'emojievents'
    | 'guildevents'
    | 'inviteevents'
    | 'messageevents'
    | 'modlogs'
    | 'roleevents'
    | 'userevents'
    | 'voiceevents'
    | 'webhookevents'
    | 'settingslog'
    | 'channelevents'
    | 'stickerevents'
    | 'threadevents'
    | 'guildmemberevents'
    | 'stageevents',
  msg: DDeno.Message | CT.MessageGuild | { guildId: bigint },
) => {
  if (!msg.guildId) return null;

  const channelPromises = (
    await client.ch
      .query(`SELECT ${columnName} FROM logchannels WHERE guildid = $1;`, [String(msg.guildId)])
      .then((r: DBT.logchannels[] | null) => (r ? r[0].messageevents : null))
  )?.map((id: string) => client.cache.channels.get(BigInt(id), msg.guildId));

  if (!channelPromises) return null;
  const channels = (await Promise.all(channelPromises)).filter((c): c is DDeno.Channel => !!c);

  return channels;
};