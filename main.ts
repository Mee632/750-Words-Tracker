import { Console } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface WordsTrackerSettings {
    streak: number;
    lastCheckedDate: string;
}

const DEFAULT_SETTINGS: WordsTrackerSettings = {
    streak: 0,
    lastCheckedDate: ''
};

export default class WordsTracker extends Plugin {
    settings: WordsTrackerSettings;

    async onload() {
        await this.loadSettings();

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('flame', '750 Words Challenge', async () => {
            await this.checkDailyWordCount();
            new Notice(`Your current streak is ${this.settings.streak} days!`);
        });
        ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app.
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText(`Streak: ${this.settings.streak} days`);

        // Update streak daily when the plugin is loaded
        await this.checkDailyWordCount();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new WordsTrackerSettingTab(this.app, this));
    }

    onunload() {
        // Cleanup if needed
    }

    async checkDailyWordCount() {
		const today = this.getTodayDate();
		if (this.settings.lastCheckedDate === today) {
			return; // Already checked today
		}
	
		// Construct the full path to the daily file
		const dailyFileName = `${today}.md`;
		const dailyFilePath = `/Users/jakobwimmer/Desktop/TestForPlugin/${dailyFileName}`;
		const dailyFile = this.app.vault.getAbstractFileByPath(dailyFilePath);
	
		if (dailyFile instanceof TFile) {
			const fileContent = await this.app.vault.read(dailyFile);
			const wordCount = this.getWordCount(fileContent);
	
			if (wordCount >= 750) {
				if (this.settings.lastCheckedDate !== today) {
					this.settings.streak += 1;
				}
			} else {
				this.settings.streak = 0; // Reset streak if less than 750 words
			}
		} else {
			this.settings.streak = 0; // Reset streak if the file doesn't exist
		}
	
		this.settings.lastCheckedDate = today;
		await this.saveSettings();
	}

    getTodayDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
		console.log(`Today's date: ${this.getTodayDate}`);
	}

    getWordCount(content: string): number {
        return content.split(/\s+/).filter(word => word.length > 0).length;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class WordsTrackerSettingTab extends PluginSettingTab {
    plugin: WordsTracker;

    constructor(app: App, plugin: WordsTracker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Current Streak')
            .setDesc('Your current writing streak in days.')
            .addText(text => text
                .setValue(this.plugin.settings.streak.toString())
                .setDisabled(true));

        new Setting(containerEl)
            .setName('Last Checked Date')
            .setDesc('The last date the streak was checked.')
            .addText(text => text
                .setValue(this.plugin.settings.lastCheckedDate)
                .setDisabled(true));
    }
}