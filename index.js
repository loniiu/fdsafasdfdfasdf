const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let userDowody = {}; // Przechowywanie dowodów użytkowników

client.once('ready', async () => {
    console.log(`Zalogowano jako ${client.user.tag}!`);

    const commands = [
        new SlashCommandBuilder()
            .setName('wdowod')
            .setDescription('Wyrobienie dowodu osobistego.')
            .addIntegerOption(option =>
                option.setName('postac')
                    .setDescription('Numer postaci (1-3)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('imie_nazwisko')
                    .setDescription('Imię i nazwisko postaci')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('data_urodzenia')
                    .setDescription('Data urodzenia (DD.MM.YYYY)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('obywatelstwo')
                    .setDescription('Obywatelstwo postaci')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('roblox_nick')
                    .setDescription('Nick Roblox')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('pdowod')
            .setDescription('Pokazuje twój dowód.')
            .addIntegerOption(option =>
                option.setName('postac')
                    .setDescription('Numer postaci (1-3)')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('udowod')
            .setDescription('Usuwa wybrany dowód.')
            .addIntegerOption(option =>
                option.setName('postac')
                    .setDescription('Numer postaci do usunięcia (1-3)')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('try')
            .setDescription('Szansa 50/50 na powodzenie.')
    ];

    await client.application.commands.set(commands);
    console.log("Komendy zostały zarejestrowane!");
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;

    // Komenda do tworzenia dowodu
    if (commandName === 'wdowod') {
        const postac = options.getInteger('postac');
        const imieNazwisko = options.getString('imie_nazwisko');
        const dataUrodzenia = options.getString('data_urodzenia');
        const obywatelstwo = options.getString('obywatelstwo');
        const robloxNick = options.getString('roblox_nick');

        // Sprawdzamy, czy użytkownik ma już wyrobiony dowód dla tej postaci
        if (!userDowody[user.id]) {
            userDowody[user.id] = {};
        }

        if (userDowody[user.id][postac]) {
            return interaction.reply({ content: `Masz już dowód dla postaci ${postac}. Usuń go przed ponownym wyrobieniem.`, ephemeral: true });
        }

        let avatarUrl = null;

        try {
            const response = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${robloxNick}`);
            if (response.data.data.length > 0) {
                const robloxId = response.data.data[0].id;
                avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=420&height=420&format=png`;
            }
        } catch (error) {
            console.error('Błąd pobierania avatara z Roblox API:', error);
            return interaction.reply({ content: `Błąd podczas pobierania avatara użytkownika **${robloxNick}**. Sprawdź, czy podany nick jest poprawny.`, ephemeral: true });
        }

        userDowody[user.id][postac] = {
            imieNazwisko,
            dataUrodzenia,
            obywatelstwo,
            robloxNick,
            avatarUrl
        };

        const embed = new EmbedBuilder()
            .setTitle(`📜 Dowód osobisty - Postać nr ${postac}`)
            .addFields(
                { name: 'Imię i nazwisko', value: imieNazwisko, inline: true },
                { name: 'Data urodzenia', value: dataUrodzenia, inline: true },
                { name: 'Obywatelstwo', value: obywatelstwo, inline: true },
                { name: 'Nick Roblox', value: robloxNick, inline: true }
            )
            .setColor(0x00AE86)
            .setFooter({ text: `Wyrobione przez ${user.tag}` })
            .setThumbnail(avatarUrl);

        await interaction.reply({ embeds: [embed] });
    }

    // Komenda do pokazywania dowodu
    if (commandName === 'pdowod') {
        const postac = options.getInteger('postac');

        if (!userDowody[user.id] || !userDowody[user.id][postac]) {
            return interaction.reply({ content: `Nie masz dowodu dla postaci ${postac}.`, ephemeral: true });
        }

        const dowod = userDowody[user.id][postac];
        const embed = new EmbedBuilder()
            .setTitle(`📜 Dowód osobisty - Postać nr ${postac}`)
            .addFields(
                { name: 'Imię i nazwisko', value: dowod.imieNazwisko, inline: true },
                { name: 'Data urodzenia', value: dowod.dataUrodzenia, inline: true },
                { name: 'Obywatelstwo', value: dowod.obywatelstwo, inline: true },
                { name: 'Nick Roblox', value: dowod.robloxNick, inline: true }
            )
            .setColor(0x00AE86)
            .setFooter({ text: `Wyrobione przez ${user.tag}` })
            .setThumbnail(dowod.avatarUrl);

        await interaction.reply({ embeds: [embed] });
    }

    // Komenda do usuwania dowodu
    if (commandName === 'udowod') {
        const postac = options.getInteger('postac');

        if (!userDowody[user.id] || !userDowody[user.id][postac]) {
            return interaction.reply({ content: `Nie masz dowodu dla postaci ${postac} do usunięcia.`, ephemeral: true });
        }

        delete userDowody[user.id][postac];
        return interaction.reply({ content: `Dowód dla postaci ${postac} został usunięty.`, ephemeral: true });
    }

    // Komenda /try (50% szansy)
    if (commandName === 'try') {
        const result = Math.random() < 0.5 ? "✅ Udało ci się!" : "❌ Nie udało ci się!";
        return interaction.reply({ content: result });
    }
});

client.login('MTM0MzY3MDQyNDc0MjkyNDM2MQ.Gos2_O.YVgafVCuoBtkmUefpjpK9lWPaDGzHb3g4hW3oE');
