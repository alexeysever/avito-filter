export default class Extension_storage {

	constructor(siteName, storage = chrome.storage) {

		this.chromeStorage = storage;
		this.storageInitialised = false;
		this.siteName = siteName;
		this.EAStorage = null;
		this.writed = true;

	}

	async initStorage() {

		if (this.storageInitialised) {
			return;
		}

		let result = await this.getDataFromStorage();

		if (result === undefined) {

			// noinspection JSCheckFunctionSignatures
			await this.setDataToStorage({
				'EAStorage': {

					// Olx
					'olx': {
						'arrID': [],
						'id': {},
						'settings': {
							'mode': 'nonMonitoring'
						},
					},

					// Avito
					'avito': {
						'settings': {
							'mode': 'nonMonitoring'
						},
						'arrID': [],
						'id': {}
					}

				}
			});

		}
		else if (result.olx === undefined) {
			await this.initOlx(result);
		}
		// Если нет новой схемы БД и есть старая
		else if (!result.avito && result.arrID) {
			await this.removeOldAvitoSettings(result);
		}

		this.storageInitialised = true;

	}

	async removeOldAvitoSettings(result) {

		result.avito = {
			arrID: result.arrID,
			id: result.id,
			settings: result.settings
		};

		delete result.arrID;
		delete result.id;
		delete result.settings;

		await this.setDataToStorage({
			'EAStorage': result
		});

	}

	async initOlx(result) {

		result.olx = {
			'arrID': [],
			'id': {},
			'settings': {
				'mode': 'nonMonitoring'
			},
		};

		await this.setDataToStorage({
			'EAStorage': result
		});

	}

	getDataFromStorage(key1 = null, key2 = null) {

		//let that = this;

		if (this.writed) {

			return new Promise(resolve => {

				chrome.storage.local.get('EAStorage', (result) => {

					this.EAStorage = result.EAStorage;
					let value = result.EAStorage;

					if (key1) {
						value = value[key1];
					}
					if (key2) {
						value = value[key2];
					}

					this.writed = false;

					resolve(value);

				});

			});

		}
		else {

			let value = this.EAStorage;

			if (key1) {
				value = value[key1];
			}
			if (key2) {
				value = value[key2];
			}

			return value;

		}

	}

	setDataToStorage(data) {

		//let that = this;

		return new Promise(resolve => {

			this.writed = true;

			// noinspection JSCheckFunctionSignatures
			chrome.storage.local.set(data, resolve);

		});

	}

	async getSettings() {
		return this.getDataFromStorage(this.siteName, 'settings');
	}

	async getMode() {
		return (await this.getSettings()).mode;
	}

	async getId() {
		return this.getDataFromStorage(this.siteName, 'id');
	}

	async getArrID() {
		return this.getDataFromStorage(this.siteName, 'arrID');
	}

	async setMode(mode) {

		this.EAStorage[this.siteName].settings.mode = mode;

		await this.setDataToStorage({
			'EAStorage': this.EAStorage
		});

	}

	async setId(id) {

		this.EAStorage[this.siteName].id = id;

		await this.setDataToStorage({
			'EAStorage': this.EAStorage
		});

	}

	async setArrID(arrID) {

		this.EAStorage[this.siteName].arrID = arrID;

		await this.setDataToStorage({
			'EAStorage': this.EAStorage
		});

	}

}