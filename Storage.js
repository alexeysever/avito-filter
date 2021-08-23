export default class Extension_storage {

    constructor() {
        this.siteName = null;
        this.storageInitialised = false;
    }

    async initStorage(siteName) {

        this.siteName = siteName;

        if (this.storageInitialised) {
            return;
        }

        let result = await this.getDataFromStorage('EAStorage');

        if (result.EAStorage === undefined) {

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
        else if (result.EAStorage.olx === undefined) {
            await this.initOlx(result);
        }
        else if (!result.EAStorage.avito && result.EAStorage.arrID) {
            await this.removeOldAvitoSettings(result);
        }

        this.storageInitialised = true;

    }

    async removeOldAvitoSettings(result) {

        result.EAStorage.avito = {
            arrID: result.EAStorage.arrID,
            id: result.EAStorage.id,
            settings: result.EAStorage.settings
        };

        delete result.EAStorage.arrID;
        delete result.EAStorage.id;
        delete result.EAStorage.settings;

        await this.setDataToStorage({
            'EAStorage': result.EAStorage
        });

    }

    async initOlx(result) {

        result.EAStorage.olx = {
            'arrID': [],
            'id': {},
            'settings': {
                'mode': 'nonMonitoring'
            },
        };

        await this.setDataToStorage({
            'EAStorage': result.EAStorage
        });

    }

    getDataFromStorage(key, path = null) {

        return new Promise(resolve => {

            chrome.storage.local.get(key, function (result) {

                let value = result;

                if (path) {
                    value = result[key][path];
                }

                resolve(value);

            });

        });

    }

    setDataToStorage(data) {

        return new Promise((resolve) => {
            // noinspection JSCheckFunctionSignatures
            chrome.storage.local.set(data, resolve);
        });

    }

}