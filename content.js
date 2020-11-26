import $ from 'jquery'

let allAds,
    vipAds,
    listAds,    // объявления без VIP
    mode,
    newID = [],
    blockedMess = [],
    idArr = [],
    boxWithX = "☒",
    boxWithOk = "🆗",
    chromeStorage = chrome.storage.local,
    timerID;
let buttonArrows = $('<div class="buttonArrows">&#8644;</div>')
let buttonClose = $("<span class='EAButton EAClose'>☒</span>").on('click', buttonCloseOrOkHandler);
let menu = $("<div class='EAMenu'></div>");
let buttonShowHidden = $("<p class='buttonShowHidden'>Показать скрытые</p>").on('click', buttonShowHiddenHandler);
let buttonStartMonitoring = $("<p class='buttonStartMonitoring' " +
    "title='Эта страница будет обновляться каждые 30 секунд, " +
    "до тех пор пока не будет найдено новое объявление, " +
    "после чего будет проиграна мелодия'>Наблюдение</p>")
    .on('click', buttonStartMonitoringHandler);

$(start)

async function start() {

    await initStorage();
    settings();

    let map = $('.cols.b-select-city');

    if (map.length < 1) {

        // попытаемся найти объявления
        if (findAd()) {

            addButtons();
            findIDInBase ()

        }

    }

}

function findIDInBase () {

    chrome.storage.local.get('EAStorage', function (result) {

        /**
         * @name storage_ids_object
         * @type {Object}
         */
        let storage_ids_object = result.EAStorage.id;

        /**
         * @name storage_ids_arr
         * @type {Array}
         */
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

        writeNewIdInBD(storage_ids_arr);
        hideBlockedMess(blockedMess);

    })

}

function monitoring() {
    if (mode === 'monitoring') {
        if ($(".EANewMess").length > 0) {
            buttonStartMonitoringHandler();
            alarmUser()
        }
        else {
            buttonStartMonitoring.addClass('isActive');
            timerID = setTimeout(function () {
                location.reload()
            }, 30000)
        }
    }
}

function alarmUser() {
    let myAudio = new Audio();
    myAudio.src = chrome.runtime.getURL("melody.mp3");
    myAudio.play().finally();
}

function settings() {
    chromeStorage.get('EAStorage', function (result) {
        let EAStorage = result.EAStorage;
        mode = EAStorage.settings.mode;
    });
}

function addColorToNewMess() {
    newID.forEach(function (item) {
        $(`[id="${item}"]`).addClass("EANewMess");
    })
}

function hideBlockedMess(arr) {
    arr.forEach(function (item) {
        let mainElem = $(`[id="${item}"]`);
        mainElem.addClass("EABlockedMess EAHiddenMess");
        $('.EAButton.EAClose', mainElem).text(boxWithOk);
    })
}

function findAd() {

    let result = false;

    allAds = $('[data-marker="catalog-serp"] [data-marker="item"]');
    vipAds = $('.serp-vips [data-marker="item"]')
    listAds = allAds.not(vipAds)

    if (allAds.length > 0) {

        result = true;

        allAds.each(function (index, item) {
            idArr.push(item.id);
        });

    }

    return result;

}

/**
 * Добавляет кнопки и меню на страницу.
 */
function addButtons() {
    // кнопки в объявлениях
    listAds.prepend(buttonClose);
    // меню
    menu.append(buttonStartMonitoring).append(buttonShowHidden).append(buttonArrows);
    $('body').append(menu);
}

/**
 * Обрабатываем нажатие кнопок "спрятать" и "показать"
 * @param event
 */
function buttonCloseOrOkHandler(event) {

    event.stopPropagation();

    if ($(event.currentTarget).text() === boxWithOk) {

        $(event.currentTarget).text(boxWithX);
        let id = event.currentTarget.parentElement.id
        $(`[id=${id}]`).removeClass("EABlockedMess EAHiddenMess");
        toggleBlockMess(event.currentTarget.parentElement, false)

    }
    else {
        let id = event.currentTarget.parentElement.id
        $(`[id=${id}]`).addClass("EABlockedMess EAHiddenMess");
        $(event.currentTarget).text(boxWithOk);
        toggleBlockMess(event.currentTarget.parentElement, true)

    }

}

/**
 * Записывает состояние для определённого ID в БД. Заблокирован или нет.
 * @param elem
 * @param bool
 */
function toggleBlockMess(elem, bool) {

    chromeStorage.get('EAStorage', function (result) {

        let EAStorage = result.EAStorage;
        let id = EAStorage.id;

        id[elem.id] = {
            block: bool
        };

        write(EAStorage)

    });

    function write(EAStorage) {
        chromeStorage.set({'EAStorage': EAStorage})
    }

}

function writeNewIdInBD(newArrID) {
    chromeStorage.get('EAStorage', function (result) {
        let EAStorage = result.EAStorage;
        EAStorage.arrID = newArrID;
        write(EAStorage)
    });
    function write(EAStorage) {
        chromeStorage.set({'EAStorage': EAStorage}, function () {
            addColorToNewMess();
            monitoring();
        })
    }
}

function buttonShowHiddenHandler(event) {
    if ($(event.currentTarget).hasClass("BSHPushed")) {
        $(event.currentTarget).removeClass('BSHPushed');
        $('.EABlockedMess').addClass('EAHiddenMess')
    }
    else {
        $('.EAHiddenMess').removeClass('EAHiddenMess');
        $(event.currentTarget).addClass('BSHPushed');
    }
}

function buttonStartMonitoringHandler() {
    if (mode === 'nonMonitoring') {
        mode = "monitoring";
        writeToSettings(mode);
        buttonStartMonitoring.addClass('isActive')
    }
    else {
        mode = "nonMonitoring";
        clearTimeout(timerID);
        writeToSettings(mode);
        buttonStartMonitoring.removeClass('isActive')
    }
}

function writeToSettings(mode) {
    chromeStorage.get('EAStorage', function (result) {
        let EAStorage = result.EAStorage;
        EAStorage.settings.mode = mode;
        write(EAStorage)
    });
    function write(EAStorage) {
        chromeStorage.set({'EAStorage': EAStorage}, function () {
            if (mode === 'monitoring') {
                location.reload();
            }
        })
    }
}

function initStorage() {

    return new Promise((resolve) => {

        chromeStorage.get("EAStorage", function (result) {

            if (result.EAStorage === undefined) {

                chromeStorage.set({
                    'EAStorage': {
                        'settings': {
                            'mode': 'nonMonitoring'
                        },
                        'arrID': [],
                        'id': {}
                    }
                }, function () {resolve()});

            }
            else {
                resolve()
            }

        })

    })


}