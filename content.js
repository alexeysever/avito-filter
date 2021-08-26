// noinspection JSValidateTypes

import $ from 'jquery';
import Extension_storage from './Storage';
import _ from 'lodash';

let mode,
    newID = [],
    blockedMess = [],
    boxWithX = '☒',
    boxWithOk = '🆗',
    timerID,
    storage,
    //DOMMutationDetected = false,
    class_buttonClose,
    selector_buttonClose,
    class_newMess,
    selector_newMess,
    selector_blockedMess,
    class_blockedMess,
    class_hiddenMess,
    selector_hiddenMess,
    class_hiddenAndBlockedMess;

let buttonArrows,
    buttonClose,
    menu,
    buttonShowHidden,
    buttonMonitoring;

// start выполнится после завершения построения DOM.
$(start);

async function start() {

    _.cond([
        [avito_is, avito_start],
        [olx_is, olx_start]
    ])(window.location.host);

}

function avito_is(host) {
    return host.search(/www\.avito\.ru/) > -1;
}

function olx_is(host) {
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

async function olx_start() {

    olx_setButtonsSettings();

    storage = new Extension_storage('olx');
    await storage.initStorage();
    await getSettings();

    await olx_findAllAds();

}

function buttonsInit() {
    buttonArrows = $('<div class="buttonArrows">&#8644;</div>');
    buttonClose = $('<span>☒</span>');
    menu = $('<div class=\'EAMenu\'></div>');
    buttonShowHidden = $('<p class=\'buttonShowHidden\'>Показать скрытые</p>');
    buttonMonitoring = $('<p class=\'buttonStartMonitoring\' ' +
        'title=\'Эта страница будет обновляться каждые 30 секунд, ' +
        'до тех пор пока не будет найдено новое объявление, ' +
        'после чего будет проиграна мелодия\'>Наблюдение</p>')
        .on('click', buttonMonitoringToggle);
}

function olx_setButtonsSettings() {

    class_buttonClose = 'olx_EAButton olx_EAClose';
    class_newMess = 'olx_EANewMess';
    class_hiddenMess = 'olx_EAHiddenMess';
    class_blockedMess = 'olx_EABlockedMess';
    class_hiddenAndBlockedMess = 'olx_EABlockedMess olx_EAHiddenMess';
    selector_buttonClose = '.olx_EAButton.olx_EAClose';
    selector_newMess = '.olx_EANewMess';
    selector_hiddenMess = '.olx_EAHiddenMess';
    selector_blockedMess = '.olx_EABlockedMess';

    // Если не произошло изменений в DOM. Это простой переход на новую
    // страницу. Или обновление страницы.
    // Добавить кнопки и обработчики на страницу.
    // В случае если - это изменение DOM (Olx), то добавление новых обработчиков
    // в дополнение к старым вызывает ошибки в работе дополнения.
    buttonsInit();
    buttonClose.addClass(class_buttonClose).on('click', olx_buttonCloseOrOkHandler);
    buttonShowHidden.on('click', olx_buttonShowHiddenHandler);

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

    buttonsInit();
    buttonClose.addClass(class_buttonClose).on('click', avito_buttonCloseOrOkHandler);
    buttonShowHidden.on('click', avito_buttonShowHiddenHandler);

}

async function olx_findAllAds() {

    let allAds = $('.wrap .offer .offer-wrapper>table');

    let idArr = allAds.map(function () {
        return $(this).attr('data-id');
    }).get();

    allAds = $('.price', allAds);

    if (allAds.length > 0) {

        addButtons(allAds);

        let newId = await findIdInBase(idArr);
        await writeNewIdInBD(newId);
        olx_addColorToNewMess();
        await monitoring();
        olx_hideBlockedMess(blockedMess);

    }

    mutationObserver();

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
        avito_addColorToNewMess();
        await monitoring();
        avito_hideBlockedMess(blockedMess);

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

function avito_addColorToNewMess() {
    newID.forEach(function (item) {
        $(`[id="${item}"]`).addClass(class_newMess);
    });
}

function olx_addColorToNewMess() {
    newID.forEach(function (item) {
        $(`[data-id="${item}"]`).addClass(class_newMess);
    });
}

let getOlxWrapElementByDataId = (id) => $('.wrap').has(`[data-id=${id}]`);
let getOlxMainElementByWrapElement = (wrapElement) => $('.offer-wrapper>table', wrapElement);
let getOlxButtonByMainElement = (mainElement) => $(selector_buttonClose, mainElement);

function olx_hideBlockedMess(arr) {

    _(arr).each(function (id) {

        let wrapElement = getOlxWrapElementByDataId(id);
        let mainElem = getOlxMainElementByWrapElement(wrapElement);

        _.flow([
            _.partial(addClass, mainElem, class_blockedMess),
            _.partial(addClass, wrapElement, class_hiddenMess),
            _.partial(getOlxButtonByMainElement, mainElem),
            _.partial(setTextElement, _, boxWithOk)
        ])();

    });

    /*arr.forEach(function (item) {
        let mainElem = getOlxWrapElementByDataId(item);
        addClass(mainElem, class_hiddenAndBlockedMess);
        //mainElem.addClass(class_hiddenAndBlockedMess);
        //$(selector_buttonClose, mainElem).text(boxWithOk);
        getOlxButtonByMainElement(mainElem);
        setTextElement(_, boxWithOk);
    });*/

}

function avito_hideBlockedMess(arr) {
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
async function avito_buttonCloseOrOkHandler(event) {

    event.stopPropagation();

    if ($(event.currentTarget).text() === boxWithOk) {

        $(event.currentTarget).text(boxWithX);
        let id = event.currentTarget.parentElement.id;
        $(`[id=${id}]`).removeClass(class_hiddenAndBlockedMess);
        await avito_toggleBlockMessInDB(event.currentTarget.parentElement, false);

    }
    else {

        let id = event.currentTarget.parentElement.id;
        $(`[id=${id}]`).addClass(class_hiddenAndBlockedMess);
        $(event.currentTarget).text(boxWithOk);
        await avito_toggleBlockMessInDB(event.currentTarget.parentElement, true);

    }

}

let setTextElement = (element, text) => $(element).text(text);
let getTextFromElement = (element) => $(element).text();
let getOlxIdFromButtonElement = (element) => $(element).closest('table').attr('data-id');
let getClosestElement = (element, selector) => $(element).closest(selector);
let removeClass = (element, cl) => $(element).removeClass(cl);
let addClass = (element, cl) => $(element).addClass(cl);
let getElementFromEvent = (event) => _.property('currentTarget')(event);
let eventStopPropagation = (event) => event.stopPropagation();

/**
 * Обрабатываем нажатие кнопок "спрятать" и "показать"
 * @param event
 */
async function olx_buttonCloseOrOkHandler(event) {

    eventStopPropagation(event);

    let buttonElement = getElementFromEvent(event);

    let isBoxWithOk = _.flow([
        _.partial(getTextFromElement, _),
        _.partial(_.isEqual, _, boxWithOk)
    ]);

    let setElementUnhidden = _.flow([
        _.partial(setTextElement, buttonElement, boxWithX),
        _.partial(getClosestElement, buttonElement, '.wrap'),
        _.partial(removeClass, _, class_hiddenMess),
        _.partial(getOlxMainElementByWrapElement, _),
        _.partial(removeClass, _, class_blockedMess),
        _.partial(getOlxIdFromButtonElement, buttonElement),
        _.partial(olx_toggleBlockMessInDB, _, false)
    ]);

    let setElementHidden = _.flow([
        _.partial(getClosestElement, buttonElement, '.wrap'),
        _.partial(addClass, _, class_hiddenMess),
        _.partial(getOlxMainElementByWrapElement, _),
        _.partial(addClass, _, class_blockedMess),
        _.partial(setTextElement, buttonElement, boxWithOk),
        _.partial(getOlxIdFromButtonElement, buttonElement),
        _.partial(olx_toggleBlockMessInDB, _, true)
    ]);

    await _.cond([
        [_.partial(isBoxWithOk, buttonElement), setElementUnhidden],
        [_.stubTrue, setElementHidden]
    ])();

}

/**
 * Записывает состояние для определённого ID в БД. Заблокирован или нет.
 * @param {string} id
 * @param {boolean} bool
 */
async function olx_toggleBlockMessInDB(id, bool) {

    let objWithIds = await storage.getId();

    objWithIds[id] = {
        block: bool
    };

    await storage.setId(objWithIds);

}

/**
 * Записывает состояние для определённого ID в БД. Заблокирован или нет.
 * @param elem
 * @param bool
 */
async function avito_toggleBlockMessInDB(elem, bool) {

    let id = await storage.getId();

    id[elem.id] = {
        block: bool
    };

    await storage.setId(id);

}

async function writeNewIdInBD(newArrID) {
    await storage.setArrID(newArrID);
}

function avito_buttonShowHiddenHandler(event) {
    if ($(event.currentTarget).hasClass('BSHPushed')) {
        $(event.currentTarget).removeClass('BSHPushed');
        $(selector_blockedMess).addClass(class_hiddenMess);
    }
    else {
        $(selector_hiddenMess).removeClass(class_hiddenMess);
        $(event.currentTarget).addClass('BSHPushed');
    }
}

function olx_buttonShowHiddenHandler(event) {
    if ($(event.currentTarget).hasClass('BSHPushed')) {
        $(event.currentTarget).removeClass('BSHPushed');
        $(selector_blockedMess).closest('.wrap').addClass(class_hiddenMess);
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

function mutationObserver() {

    let mutationObserver = new MutationObserver(function () {

        //DOMMutationDetected = true;
        mutationObserver.disconnect();
        newID = [];
        blockedMess = [];

        setTimeout(function () {
            start().finally();
        }, 2000);

    });

    mutationObserver.observe(document.getElementById('listContainer'), {childList: true});

}
