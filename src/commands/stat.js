/*
    Copyright (C) 2024 Rustyy Bot

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const RustoriaApi = require('../util/rustoriaApi.js');

module.exports = {
    name: 'stat',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('stat')
            .setDescription(client.intlGet(guildId, 'commandsStatDesc'))
            .addStringOption(option => option
                .setName('username')
                .setDescription(client.intlGet(guildId, 'commandsStatUsernameDesc'))
                .setRequired(true))
            .addStringOption(option => option
                .setName('server')
                .setDescription(client.intlGet(guildId, 'commandsStatServerDesc'))
                .setRequired(false)
                .addChoices(
                    ...Object.keys(RustoriaApi.SERVERS).map(key => ({
                        name: key,
                        value: RustoriaApi.SERVERS[key]
                    })).slice(0, 25)
                ))
            .addStringOption(option => option
                .setName('category')
                .setDescription(client.intlGet(guildId, 'commandsStatCategoryDesc'))
                .setRequired(false)
                .addChoices(
                    ...RustoriaApi.CATEGORIES.map(cat => ({ name: cat, value: cat }))
                ));
    },

    async execute(client, interaction) {
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        const username = interaction.options.getString('username');
        const server = interaction.options.getString('server') || 'vanilla_medium_sea';
        const category = interaction.options.getString('category') || 'pvp';

        try {
            const data = await RustoriaApi.getPlayerStats(server, username, category);

            if (!data.leaderboard || data.leaderboard.length === 0) {
                const str = client.intlGet(interaction.guildId, 'statPlayerNotFound', {
                    username: username
                });
                await client.interactionEditReply(interaction,
                    DiscordEmbeds.getActionInfoEmbed(1, str));
                return;
            }

            const embeds = [];
            const players = data.leaderboard.slice(0, 5);

            for (const player of players) {
                const d = player.data;
                let description = '';

                if (category === 'pvp') {
                    description = [
                        `**KDR:** ${d.kdr}`,
                        `**Kills:** ${d.pvp_player_kills_total}`,
                        `**Deaths:** ${d.pvp_player_deaths_total}`,
                        `**Suicides:** ${d.pvp_player_deaths_suicides}`,
                        `**Headshots:** ${d.pvp_player_headshot}`,
                        `**Wounds:** ${d.pvp_player_wounds_total}`,
                        `**Accuracy:** ${d.accuracy}%`,
                        `**Bullets Fired:** ${d.weapon_bullet_fired_total}`,
                        `**Bullets Hit:** ${d.weapon_bullet_hit_player}`,
                    ].join('\n');
                } else {
                    description = Object.entries(d)
                        .map(([key, val]) => `**${RustoriaApi.formatStatKey(key)}:** ${val}`)
                        .join('\n');
                }

                embeds.push(DiscordEmbeds.getEmbed({
                    title: player.username,
                    color: Constants.COLOR_DEFAULT,
                    description: description,
                    thumbnail: player.avatar || '',
                    footer: {
                        text: `${category.toUpperCase()} | ${server.replace(/_/g, ' ')} | Total: ${player.total}`
                    },
                    timestamp: true
                }));
            }

            const footer = `${data.totalItems} players found for "${username}"`;
            await client.interactionEditReply(interaction, {
                embeds: embeds,
                content: footer,
                ephemeral: true
            });
        }
        catch (e) {
            client.log(client.intlGet(null, 'errorCap'), e, 'error');
            const str = client.intlGet(interaction.guildId, 'statFetchError');
            await client.interactionEditReply(interaction,
                DiscordEmbeds.getActionInfoEmbed(1, str));
        }
    }
};
