import $ from 'jquery';
import Extension_storage from './Storage';
import {cond} from 'lodash';

let mode,
    newID = [],
    blockedMess = [],
    boxWithX = '☒',
    boxWithOk = '🆗',
    timerID,
    storage,
    class_buttonClose,
    selector_buttonClose,
    class_newMess,
    selector_newMess,
    selector_blockedMess,
    class_hiddenMess,
    selector_hiddenMess,
    class_hiddenAndBlockedMess;
let buttonArrows = $('<div class="buttonArrows">&#8644;</div>');
let buttonClose = $('<span>☒</span>').on('click', buttonCloseOrOkHandler);
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

    //await initStorage();
    //storage = new Extension_storage();

    await cond([
        [avito_is, avito_start],
        [olx_is, olx_start]
    ])(window.location.host);

}

async function avito_is(host) {
    return host.search(/www\.avito\.ru/) > -1;
}

async function olx_is(host) {

    await getSettings('olx');

    return host.search(/www\.olx\.ua/) > -1;

}

async function avito_start() {

    // Продолжить если это не главная страница.
    if (!$('.cols.b-select-city').length) {

        avito_setButtonsSettings();

        storage = new Extension_storage('avito');
        await storage.initStorage();
        await getSettings();

        // Найти все объявления.
        await avito_findAllAds();

    }

}

function avito_setButtonsSettings() {

    class_buttonClose = 'avt_EAButton avt_EAClose';
    class_newMess = 'avt_EANewMess';
    class_hiddenMess = 'avt_EAHiddenMess';
    class_hiddenAndBlockedMess = 'avt_EABlockedMess avt_EAHiddenMess';
    selector_buttonClose = '.avt_EAButton.avt_EAClose';
    selector_newMess = '.avt_EANewMess';
    selector_hiddenMess = '.avt_EAHiddenMess';
    selector_blockedMess = '.avt_EABlockedMess';

    buttonClose.addClass(class_buttonClose);
}

function olx_start() {

}

async function avito_findAllAds() {

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

        let newId = await findIdInBase(idArr);

        await writeNewIdInBD(newId);
        addColorToNewMess();
        await monitoring();
        hideBlockedMess(blockedMess);

    }

}

async function findIdInBase(idArr) {

    let storage_ids_object = await storage.getId();
    let storage_ids_arr = await storage.getArrID();

    idArr.forEach(function (item) {

        // Если такой id уже есть в БД
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

    return storage_ids_arr;

}

async function monitoring() {

    if (mode === 'monitoring') {
        // Если есть новые объявления.
        if ($(selector_newMess).length > 0) {
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

async function getSettings() {
    mode = await storage.getMode();
}

function addColorToNewMess() {
    newID.forEach(function (item) {
        $(`[id="${item}"]`).addClass(class_newMess);
    });
}

function hideBlockedMess(arr) {
    arr.forEach(function (item) {
        let mainElem = $(`[id="${item}"]`);
        mainElem.addClass(class_hiddenAndBlockedMess);
        $(selector_buttonClose, mainElem).text(boxWithOk);
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
        $(`[id=${id}]`).removeClass(class_hiddenAndBlockedMess);
        await toggleBlockMess(event.currentTarget.parentElement, false);

    }
    else {

        let id = event.currentTarget.parentElement.id;
        $(`[id=${id}]`).addClass(class_hiddenAndBlockedMess);
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

    let id = await storage.getId();

    id[elem.id] = {
        block: bool
    };

    await storage.setId(id);

}

async function writeNewIdInBD(newArrID) {
    await storage.setArrID(newArrID);
}

function buttonShowHiddenHandler(event) {
    if ($(event.currentTarget).hasClass('BSHPushed')) {
        $(event.currentTarget).removeClass('BSHPushed');
        $(selector_blockedMess).addClass(class_hiddenMess);
    }
    else {
        $(selector_hiddenMess).removeClass(class_hiddenMess);
        $(event.currentTarget).addClass('BSHPushed');
    }
}

async function buttonMonitoringToggle() {

    if (mode === 'nonMonitoring') {
        mode = 'monitoring';
        await storage.setMode(mode);
        buttonMonitoring.addClass('isActive');
        location.reload();
    }
    else {
        mode = 'nonMonitoring';
        clearTimeout(timerID);
        await storage.setMode(mode);
        buttonMonitoring.removeClass('isActive');
    }

}
