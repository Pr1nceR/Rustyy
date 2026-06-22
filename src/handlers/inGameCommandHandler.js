/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

    https://github.com/alexemanuelol/rustplusplus

*/

const SmartAlarmHandler = require('./smartAlarmHandler.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const SmartSwitchHandler = require('./smartSwitchHandler.js');
const RustoriaApi = require('../util/rustoriaApi.js');

module.exports = {
    inGameCommandHandler: async function (rustplus, client, message) {
        const guildId = rustplus.guildId;
        const instance = client.getInstance(guildId);

        let command = message.broadcast.teamMessage.message.message;
        for (const alias of instance.aliases) {
            command = command.replace(alias.alias, alias.value);
        }

        const callerSteamId = message.broadcast.teamMessage.message.steamId.toString();
        const callerName = message.broadcast.teamMessage.message.name;
        const commandLowerCase = command.toLowerCase();
        const prefix = rustplus.generalSettings.prefix;

        if (!rustplus.isOperational) {
            return false;
        }
        else if (!rustplus.generalSettings.inGameCommandsEnabled) {
            return false;
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxAfk')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxAfk')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandAfk());
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxAlive')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxAlive')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandAlive(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxCargo')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxCargo')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandCargo());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxChinook')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxChinook')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandChinook());
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxConnection')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxConnections')}`)) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxConnection')} `) ||
                commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxConnections')}`))) {
            rustplus.sendInGameMessage(rustplus.getCommandConnection(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxCraft')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxCraft')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandCraft(command));
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxDeath')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxDeaths')}`)) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxDeath')} `) ||
                commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxDeaths')}`))) {
            rustplus.sendInGameMessage(await rustplus.getCommandDeath(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxDecay')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxDecay')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandDecay(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxDespawn')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxDespawn')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandDespawn(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxEvents')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxEvents')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandEvents(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxHeli')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxHeli')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandHeli());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxLarge')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxLarge')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandLarge());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxLeaderboard')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxLeaderboard')}` ||
            commandLowerCase === `${prefix}leaderboards` ||
            commandLowerCase === `${prefix}lb`) {
            try {
                const teamPlayers = rustplus.team.players.map(p => p.name);
                if (teamPlayers.length === 0) {
                    rustplus.sendInGameMessage('No team members found.');
                } else {
                    const results = await RustoriaApi.getTeamLeaderboard(teamPlayers);
                    if (results.length === 0) {
                        rustplus.sendInGameMessage('No stats found for team members.');
                    } else {
                        rustplus.sendInGameMessage(':gem: Team Leaderboard (PVP)');
                        const top5 = results.slice(0, 5);
                        for (let i = 0; i < top5.length; i++) {
                            const r = top5[i];
                            const rank = r.rank ? `#${r.rank}` : '>200';
                            rustplus.sendInGameMessage(
                                `${i + 1}. ${r.username} | K:${r.kills} D:${r.deaths} KDR:${r.kdr} | ${rank}`);
                        }
                    }
                }
            } catch (e) {
                rustplus.sendInGameMessage('Failed to fetch leaderboard from Rustoria.');
            }
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTopfarmer')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTopfarmer')}`)) {
            const arg = command.slice(command.indexOf(' ') + 1).trim().toLowerCase();
            const validResources = ['sulfur', 'metal', 'hqm', 'stone', 'wood'];
            const resource = (arg && validResources.includes(arg)) ? arg : null;
            try {
                const teamPlayers = rustplus.team.players.map(p => p.name);
                if (teamPlayers.length === 0) {
                    rustplus.sendInGameMessage('No team members found.');
                } else {
                    const results = await RustoriaApi.getTeamFarmers(teamPlayers, resource);
                    if (results.length === 0) {
                        rustplus.sendInGameMessage('No farming stats found for team.');
                    } else {
                        const label = resource ? resource.charAt(0).toUpperCase() + resource.slice(1) : 'Weighted';
                        rustplus.sendInGameMessage(`:catwhat: Top Farmers (${label})`);
                        const top5 = results.slice(0, 5);
                        for (let i = 0; i < top5.length; i++) {
                            const r = top5[i];
                            if (resource) {
                                rustplus.sendInGameMessage(
                                    `${i + 1}. ${r.username} | ${r[resource].toLocaleString()}`);
                            } else {
                                rustplus.sendInGameMessage(
                                    `${i + 1}. ${r.username} | S:${r.sulfur} M:${r.metal} St:${r.stone} W:${r.wood}`);
                            }
                        }
                    }
                }
            } catch (e) {
                rustplus.sendInGameMessage('Failed to fetch farming stats from Rustoria.');
            }
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxPlantita')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxPlantita')}`) {
            try {
                const teamPlayers = rustplus.team.players.map(p => p.name);
                if (teamPlayers.length === 0) {
                    rustplus.sendInGameMessage('No team members found.');
                } else {
                    const results = await RustoriaApi.getTeamPlantita(teamPlayers);
                    if (results.length === 0) {
                        rustplus.sendInGameMessage('No plant stats found for team.');
                    } else {
                        rustplus.sendInGameMessage(':catsmile: Plantita Leaderboard');
                        const top5 = results.slice(0, 5);
                        for (let i = 0; i < top5.length; i++) {
                            const r = top5[i];
                            rustplus.sendInGameMessage(
                                `${i + 1}. ${r.username} | Cloth:${r.cloth} YB:${r.yb} RB:${r.rb} BB:${r.bb}`);
                        }
                    }
                }
            } catch (e) {
                rustplus.sendInGameMessage('Failed to fetch plant stats from Rustoria.');
            }
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxLeader')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxLeader')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandLeader(command, callerSteamId));
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxMarker')} `) ||
            commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxMarkers')}`) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxMarker')} `) ||
                commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxMarkers')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandMarker(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxMarket')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxMarket')} `)) {
            rustplus.sendInGameMessage(rustplus.getCommandMarket(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxMute')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxMute')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandMute());
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxNote')} `) ||
            commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxNotes')}`) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxNote')} `) ||
                commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxNotes')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandNote(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxOffline')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxOffline')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandOffline());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxOnline')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxOnline')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandOnline());
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxPlayer')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxPlayers')}`)) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxPlayer')} `) ||
                commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxPlayers')}`))) {
            rustplus.sendInGameMessage(rustplus.getCommandPlayer(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxPop')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxPop')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandPop());
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxProx')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxProx')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandProx(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxRecycle')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxRecycle')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandRecycle(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxResearch')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxResearch')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandResearch(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxSend')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxSend')} `)) {
            rustplus.sendInGameMessage(await rustplus.getCommandSend(command, callerName));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxSmall')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxSmall')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandSmall());
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxStack')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxStack')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandStack(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxSteamid')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxSteamid')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandSteamId(command, callerSteamId, callerName));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxTeam')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxTeam')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandTeam());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxPlaytime')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxPlaytime')}`) {
            rustplus.sendInGameMessage(await rustplus.getCommandPlaytime());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxAfktime')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxAfktime')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandAfktime());
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTrack')}`) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTrack')}`)) {
            rustplus.sendInGameMessage(await rustplus.getCommandTrack(command));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxTime')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxTime')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandTime());
        }
        else if ((commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTimer')} `) ||
            commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxTimers')}`) ||
            (commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTimer')} `) ||
                commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxTimers')}`)) {
            rustplus.sendInGameMessage(rustplus.getCommandTimer(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTranslateTo')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTranslateTo')} `)) {
            rustplus.sendInGameMessage(await rustplus.getCommandTranslateTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTranslateFromTo')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTranslateFromTo')} `)) {
            rustplus.sendInGameMessage(await rustplus.getCommandTranslateFromTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxTTS')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxTTS')} `)) {
            rustplus.sendInGameMessage(await rustplus.getCommandTTS(command, callerName));
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxUnmute')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxUnmute')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandUnmute());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxUpkeep')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxUpkeep')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandUpkeep());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxUptime')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxUptime')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandUptime());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxWipe')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxWipe')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandWipe());
        }
        else if (commandLowerCase === `${prefix}${client.intlGet('en', 'commandSyntaxTravelingVendor')}` ||
            commandLowerCase === `${prefix}${client.intlGet(guildId, 'commandSyntaxTravelingVendor')}`) {
            rustplus.sendInGameMessage(rustplus.getCommandTravelingVendor());
        }
        else if (commandLowerCase.startsWith(`${prefix}${client.intlGet('en', 'commandSyntaxStat')} `) ||
            commandLowerCase.startsWith(`${prefix}${client.intlGet(guildId, 'commandSyntaxStat')} `) ||
            commandLowerCase.startsWith(`${prefix}stats `)) {
            const args = command.slice(command.indexOf(' ') + 1).trim().split(' ');
            const validCategories = RustoriaApi.CATEGORIES;
            let category = 'pvp';
            let usernameParts = [];

            for (const arg of args) {
                if (validCategories.includes(arg.toLowerCase())) {
                    category = arg.toLowerCase();
                } else {
                    usernameParts.push(arg);
                }
            }
            const username = usernameParts.join(' ');

            if (!username) {
                rustplus.sendInGameMessage('Usage: !stat <name> [category]');
            } else {
                try {
                    const data = await RustoriaApi.getPlayerStats('vanilla_medium_sea', username, category);
                    if (!data.leaderboard || data.leaderboard.length === 0) {
                        rustplus.sendInGameMessage(`No stats found for "${username}" (${category})`);
                    } else {
                        const p = data.leaderboard[0];
                        const d = p.data;
                        if (category === 'pvp') {
                            rustplus.sendInGameMessage(
                                `${p.username} | KDR: ${d.kdr} | K: ${d.pvp_player_kills_total} | ` +
                                `D: ${d.pvp_player_deaths_total} | HS: ${d.pvp_player_headshot} | Acc: ${d.accuracy}%`);
                        } else {
                            const top3 = Object.entries(d).slice(0, 3)
                                .map(([k, v]) => `${RustoriaApi.formatStatKey(k)}: ${v}`).join(' | ');
                            rustplus.sendInGameMessage(`${p.username} [${category}] | ${top3}`);
                        }
                    }
                } catch (e) {
                    rustplus.sendInGameMessage('Failed to fetch stats from Rustoria.');
                }
            }
        }
        else {
            /* Maybe a custom command? */

            if (SmartAlarmHandler.smartAlarmCommandHandler(rustplus, client, command)) {
                rustplus.logInGameCommand('Smart Alarm', message);
                return true;
            }

            if (await SmartSwitchHandler.smartSwitchCommandHandler(rustplus, client, command)) {
                rustplus.logInGameCommand('Smart Switch', message);
                return true;
            }

            if (await SmartSwitchGroupHandler.smartSwitchGroupCommandHandler(rustplus, client, command)) {
                rustplus.logInGameCommand('Smart Switch Group', message);
                return true;
            }

            return false;
        }

        rustplus.logInGameCommand('Default', message);

        return true;
    },
};
