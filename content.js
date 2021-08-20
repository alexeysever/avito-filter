import $ from 'jquery';
import _ from 'lodash';

let mode,
    newID = [],
    blockedMess = [],
    boxWithX = '☒',
    boxWithOk = '🆗',
    timerID;
let buttonArrows = $('<div class="buttonArrows">&#8644;</div>');
let buttonClose = $('<span class=\'EAButton EAClose\'>☒</span>').on('click', buttonCloseOrOkHandler);
let menu = $('<div class=\'EAMenu\'></div>');
let buttonShowHidden = $('<p class=\'buttonShowHidden\'>Показать скрытые</p>').on('click', buttonShowHiddenHandler);
let buttonMonitoring = $('<p class=\'buttonStartMonitoring\' ' +
    'title=\'Эта страница будет обновляться каждые 30 секунд, ' +
    'до тех пор пока не будет найдено новое объявление, ' +
    'после чего будет проиграна мелодия\'>Наблюдение</p>')
    .on('click', buttonMonitoringToggle);

// start выполнится после завершения построения DOM.
$(start);

async function start() {

    await initStorage();

    await _.cond([
        [avito_is, avito_start],
        [olx_is, olx_start]
    ])(window.location.host);

}

async function avito_is (host) {

    await settings('avito');

    return host.search(/www\.avito\.ru/) > -1;

}

async function olx_is (host) {

    await settings('olx');

    return host.search(/www\.olx\.ua/) > -1;

}

async function avito_start () {

    // Продолжить если это не главная страница.
    if (!$('.cols.b-select-city').length) {
        // Найти все объявления.
        await avito_findAllAds();
    }

}

async function avito_findAllAds () {

    let allAds = $('[data-marker="catalog-serp"] [data-marker="item"]');

    // Тут происходит преобразование набора элементов в массив с набором id.
    let idArr = allAds.map(function () {
        return this.id;
    }).get();

    let vipAds = $('.serp-vips [data-marker="item"]').add('[class*="items-vip-"] [data-marker="item"]');
    let witcherAds = $('[class*="items-witcher-"] [data-marker="item"]');
    let listAds = allAds.not(vipAds).not(witcherAds);

    if (listAds.length > 0) {
        addButtons(listAds);
        await findIDInBase(idArr);
    }

}

function olx_start () {

}

async function findIDInBase (idArr) {

    let result = await getDataFromStorage('EAStorage');

    let storage_ids_object = result.EAStorage.id;
    let storage_ids_arr = result.EAStorage.arrID;

    idArr.forEach(function (item) {

        // Если такой id уже есть в БД
        /**
         * @name item
         * @type {String}
         */
        if (item in storage_ids_object) {

            // Если настройка "заблокирован" установленна в true у этого id
            if (storage_ids_object[item].block === true) {
                blockedMess.push(item);
            }

        }

        // Если такого id нет в БД
        if (storage_ids_arr.indexOf(item) === -1) {

            storage_ids_arr.push(item);
            newID.push(item);

        }

    });

    await writeNewIdInBD(storage_ids_arr);
    hideBlockedMess(blockedMess);

}

async function monitoring() {
    if (mode === 'monitoring') {
        // Если есть новые объявления.
        if ($('.EANewMess').length > 0) {
            await buttonMonitoringToggle();
            alarmUser();
        }
        else {
            buttonMonitoring.addClass('isActive');
            timerID = setTimeout(function () {
                location.reload();
            }, 30000);
        }
    }
}

function alarmUser() {
    let myAudio = new Audio();
    myAudio.src = chrome.runtime.getURL('melody.mp3');
    myAudio.play().finally();
}

async function settings(site) {

    let result = await getDataFromStorage('EAStorage');
    let EAStorage;

    if (site === 'avito') {
        EAStorage = result.EAStorage;
    }
    else if (site === 'olx') {
        EAStorage = result.EAStorage.olx;
    }

    mode = EAStorage.settings.mode;

}

function addColorToNewMess() {
    newID.forEach(function (item) {
        $(`[id="${item}"]`).addClass('EANewMess');
    });
}

function hideBlockedMess(arr) {
    arr.forEach(function (item) {
        let mainElem = $(`[id="${item}"]`);
        mainElem.addClass('EABlockedMess EAHiddenMess');
        $('.EAButton.EAClose', mainElem).text(boxWithOk);
    });
}

/**
 * Добавляет кнопки и меню на страницу.
 */
function addButtons(listAds) {

    // кнопки в объявлениях
    listAds.prepend(buttonClose);
    // меню
    menu.append(buttonMonitoring).append(buttonShowHidden).append(buttonArrows);
    $('body').append(menu);

}

/**
 * Обрабатываем нажатие кнопок "спрятать" и "показать"
 * @param event
 */
async function buttonCloseOrOkHandler(event) {

    event.stopPropagation();

    if ($(event.currentTarget).text() === boxWithOk) {

        $(event.currentTarget).text(boxWithX);
        let id = event.currentTarget.parentElement.id;
        $(`[id=${id}]`).removeClass('EABlockedMess EAHiddenMess');
        await toggleBlockMess(event.currentTarget.parentElement, false);

    }
    else {

        let id = event.currentTarget.parentElement.id;
        $(`[id=${id}]`).addClass('EABlockedMess EAHiddenMess');
        $(event.currentTarget).text(boxWithOk);
        await toggleBlockMess(event.currentTarget.parentElement, true);

    }

}

/**
 * Записывает состояние для определённого ID в БД. Заблокирован или нет.
 * @param elem
 * @param bool
 */
async function toggleBlockMess(elem, bool) {

    let EAStorage = (await getDataFromStorage('EAStorage')).EAStorage;

    let id = EAStorage.id;

    id[elem.id] = {
        block: bool
    };

    await setDataToStorage({'EAStorage': EAStorage});

}

async function writeNewIdInBD(newArrID) {

    let EAStorage = (await getDataFromStorage('EAStorage')).EAStorage;

    EAStorage.arrID = newArrID;

    await setDataToStorage({'EAStorage': EAStorage});
    addColorToNewMess();
    await monitoring();

}

function buttonShowHiddenHandler(event) {
    if ($(event.currentTarget).hasClass('BSHPushed')) {
        $(event.currentTarget).removeClass('BSHPushed');
        $('.EABlockedMess').addClass('EAHiddenMess');
    }
    else {
        $('.EAHiddenMess').removeClass('EAHiddenMess');
        $(event.currentTarget).addClass('BSHPushed');
    }
}

async function buttonMonitoringToggle() {
    if (mode === 'nonMonitoring') {
        mode = 'monitoring';
        await writeModeToSettings(mode);
        buttonMonitoring.addClass('isActive');
    }
    else {
        mode = 'nonMonitoring';
        clearTimeout(timerID);
        await writeModeToSettings(mode);
        buttonMonitoring.removeClass('isActive');
    }
}

async function writeModeToSettings(mode) {

    let EAStorage = (await getDataFromStorage('EAStorage')).EAStorage;

    EAStorage.settings.mode = mode;

    await setDataToStorage({'EAStorage': EAStorage});

    if (mode === 'monitoring') {
        location.reload();
    }

}

function getDataFromStorage (key, path = null) {

    return new Promise(resolve =>  {

        chrome.storage.local.get(key, function (result) {

            let value = result;

            if (path){
                value = result[key][path];
            }

            resolve(value);

        });

    });

}

function setDataToStorage (data) {

    return new Promise((resolve) => {
        // noinspection JSCheckFunctionSignatures
        chrome.storage.local.set(data, resolve);
    });

}

async function initStorage() {

    let result = await getDataFromStorage('EAStorage');

    if (result.EAStorage === undefined) {

        // noinspection JSCheckFunctionSignatures
        await setDataToStorage({
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
                'settings': {
                    'mode': 'nonMonitoring'
                },
                'arrID': [],
                'id': {}

            }
        });

    }

}