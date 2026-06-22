const Axios = require('axios');

const RUSTORIA_API_BASE = 'https://api.rustoria.co/statistics';

const SERVERS = {
    'us-low-pop': 'us_low_pop',
    'vanilla-main-eu': 'vanilla_main_eu',
    'vanilla-main-us': 'vanilla_main_us',
    'vanilla-medium-eu': 'vanilla_medium_eu',
    'vanilla-medium-us': 'vanilla_medium_us',
    'vanilla-medium-sea': 'vanilla_medium_sea',
    'vanilla-long-eu': 'vanilla_long_eu',
    'vanilla-long-us': 'vanilla_long_us',
    'vanilla-long-sea': 'vanilla_long_sea',
    'vanilla-main-br': 'vanilla_main_br',
    'vanilla-long-br': 'vanilla_long_br',
    'vanilla-medium-au': 'vanilla_medium_au',
    'vanilla-small-eu': 'vanilla_small_eu',
    'vanilla-small-us': 'vanilla_small_us',
    'eu-low-pop': 'eu_low_pop',
    '2x-vanilla-eu': '2x_vanilla_eu_main',
    '5x-eu': 'nobps_5x_eu',
    '5x-us': 'nobps_5x_us',
    '10x-eu': 'nobps_10x_eu',
    '10x-us': 'nobps_10x_us',
};

const CATEGORIES = ['pvp', 'pve', 'resources', 'building', 'raiding', 'loot', 'farming', 'vending', 'scrap', 'misc'];

const STAT_LABELS = {
    'farming_resource_sulfur_harvested': 'Sulfur',
    'farming_resource_metal_harvested': 'Metal',
    'farming_resource_hqm_harvested': 'HQM',
    'farming_resource_stone_harvested': 'Stone',
    'farming_resource_wood_harvested': 'Wood',
    'farming_animal_leather_harvested': 'Leather',
    'farming_animal_fat_harvested': 'Fat',
    'farming_animal_bone_harvested': 'Bone',
    'farming_resource_scrap_harvested': 'Scrap',
    'pvp_player_kills_total': 'Kills',
    'pvp_player_deaths_total': 'Deaths',
    'pvp_player_deaths_suicides': 'Suicides',
    'pvp_player_headshot': 'Headshots',
    'pvp_player_wounds_total': 'Wounds',
    'weapon_bullet_fired_total': 'Bullets Fired',
    'weapon_bullet_hit_player': 'Bullets Hit',
    'kdr': 'KDR',
    'accuracy': 'Accuracy',
};

function formatStatKey(key) {
    if (STAT_LABELS[key]) return STAT_LABELS[key];
    return key.replace(/^(farming_|pvp_|weapon_|building_|raiding_|loot_|vending_|scrap_|misc_)/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

async function getPlayerStats(serverSlug, username, category = 'pvp') {
    const url = `${RUSTORIA_API_BASE}/leaderboards/${serverSlug}/${category}`;
    const response = await Axios.get(url, {
        params: {
            from: 0,
            sortBy: 'total',
            orderBy: 'desc',
            username: username,
            wipe: ''
        },
        timeout: 10000
    });
    return response.data;
}

async function getWipes(serverSlug) {
    const url = `${RUSTORIA_API_BASE}/wipes/${serverSlug}`;
    const response = await Axios.get(url, { timeout: 10000 });
    return response.data;
}

async function getTeamLeaderboard(playerNames, serverSlug = 'vanilla_medium_sea', category = 'pvp') {
    // Fetch stats for each team member in parallel
    const statPromises = playerNames.map(name =>
        getPlayerStats(serverSlug, name, category)
            .then(data => {
                if (data.leaderboard && data.leaderboard.length > 0) {
                    const p = data.leaderboard[0];
                    return {
                        username: p.username,
                        total: p.total,
                        kills: p.data.pvp_player_kills_total || 0,
                        deaths: p.data.pvp_player_deaths_total || 0,
                        kdr: p.data.kdr || '0',
                        rank: null
                    };
                }
                return null;
            })
            .catch(() => null)
    );

    const stats = (await Promise.all(statPromises)).filter(s => s !== null);
    if (stats.length === 0) return [];

    // Sort by kills descending
    stats.sort((a, b) => b.kills - a.kills);

    // Fetch top 200 unfiltered to find global ranks
    const pagePromises = [];
    for (let i = 0; i < 200; i += 10) {
        pagePromises.push(
            Axios.get(`${RUSTORIA_API_BASE}/leaderboards/${serverSlug}/${category}`, {
                params: { from: i, sortBy: 'total', orderBy: 'desc', username: '', wipe: '' },
                timeout: 10000
            }).then(r => r.data.leaderboard || []).catch(() => [])
        );
    }
    const pages = await Promise.all(pagePromises);
    const allPlayers = pages.flat();

    // Match team members to find their global rank
    for (const stat of stats) {
        const idx = allPlayers.findIndex(p => p.username === stat.username);
        if (idx !== -1) {
            stat.rank = idx + 1;
        }
    }

    return stats;
}

const FARM_WEIGHTS = { sulfur: 3, metal: 2, hqm: 5, stone: 1, wood: 0.5 };
const FARM_KEYS = {
    sulfur: 'farming_resource_sulfur_harvested',
    metal: 'farming_resource_metal_harvested',
    hqm: 'farming_resource_hqm_harvested',
    stone: 'farming_resource_stone_harvested',
    wood: 'farming_resource_wood_harvested',
};

async function getTeamFarmers(playerNames, resource = null, serverSlug = 'vanilla_medium_sea') {
    const statPromises = playerNames.map(name =>
        getPlayerStats(serverSlug, name, 'resources')
            .then(data => {
                if (data.leaderboard && data.leaderboard.length > 0) {
                    const p = data.leaderboard[0];
                    const d = p.data;
                    const sulfur = d[FARM_KEYS.sulfur] || 0;
                    const metal = d[FARM_KEYS.metal] || 0;
                    const hqm = d[FARM_KEYS.hqm] || 0;
                    const stone = d[FARM_KEYS.stone] || 0;
                    const wood = d[FARM_KEYS.wood] || 0;
                    const score = Math.round(
                        sulfur * FARM_WEIGHTS.sulfur +
                        metal * FARM_WEIGHTS.metal +
                        hqm * FARM_WEIGHTS.hqm +
                        stone * FARM_WEIGHTS.stone +
                        wood * FARM_WEIGHTS.wood
                    );
                    return { username: p.username, sulfur, metal, hqm, stone, wood, score };
                }
                return null;
            })
            .catch(() => null)
    );

    const stats = (await Promise.all(statPromises)).filter(s => s !== null);
    if (stats.length === 0) return [];

    if (resource && FARM_KEYS[resource]) {
        stats.sort((a, b) => b[resource] - a[resource]);
    } else {
        stats.sort((a, b) => b.score - a.score);
    }

    return stats;
}

async function getTeamPlantita(playerNames, serverSlug = 'vanilla_medium_sea') {
    const statPromises = playerNames.map(name =>
        getPlayerStats(serverSlug, name, 'farming')
            .then(data => {
                if (data.leaderboard && data.leaderboard.length > 0) {
                    const p = data.leaderboard[0];
                    const d = p.data;
                    const cloth = d['farming_plant_cloth_harvested'] || 0;
                    const yb = d['farming_plant_berry_yellow_harvested'] || 0;
                    const rb = d['farming_plant_berry_red_harvested'] || 0;
                    const bb = d['farming_plant_berry_blue_harvested'] || 0;
                    const total = cloth + yb + rb + bb;
                    return { username: p.username, cloth, yb, rb, bb, total };
                }
                return null;
            })
            .catch(() => null)
    );

    const stats = (await Promise.all(statPromises)).filter(s => s !== null);
    if (stats.length === 0) return [];
    stats.sort((a, b) => b.total - a.total);
    return stats;
}

module.exports = {
    SERVERS,
    CATEGORIES,
    STAT_LABELS,
    FARM_KEYS,
    formatStatKey,
    getPlayerStats,
    getWipes,
    getTeamLeaderboard,
    getTeamFarmers,
    getTeamPlantita
};
