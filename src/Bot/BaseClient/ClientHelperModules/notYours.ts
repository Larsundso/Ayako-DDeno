import type DDeno from 'discordeno';
import type CT from '../../Typings/CustomTypings';
import constants from '../Other/Constants.js';
import reply from './replyCmd.js';

export default (interaction: CT.ButtonInteraction, language: CT.Language) => {
  const embed: DDeno.Embed = {
    author: {
      name: language.error,
      iconUrl: constants.standard.error,
      url: constants.standard.invite,
    },
    color: constants.colors.warning,
    description: language.errors.notYours,
  };

  reply(interaction, { data: { embeds: [embed] }, ephemeral: true, type: 4 });
};
