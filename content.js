let catalog,
    ads,
    EAStorage,
    mode,
    newID = [],
    blockedMess = [],
    idArr = [],
    boxWithX = "☒",
    boxWithOk = "🆗",
    chromeStorage = chrome.storage.local,
    timerID;
let buttonArrows = $('<div class="buttonArrows">&#8644;</div>').on('click', buttonArrowsHandler);
let buttonClose = $("<span class='EAButton EAClose'>☒</span>").on('click', buttonCloseHandler);
let menu = $("<div class='EAMenu'></div>");
let buttonShowHidden = $("<p class='buttonShowHidden'>Показать скрытые</p>").on('click', buttonShowHiddenHandler);
let buttonStartMonitoring = $("<p class='buttonStartMonitoring' " +
    "title='Эта страница будет обновляться каждые 30 секунд, " +
    "до тех пор пока не будет найдено новое объявление, " +
    "после чего будет проиграна мелодия'>Наблюдение</p>")
    .on('click', buttonStartMonitoringHandler);

initStorage();
settings();

window.onload = function () {
    let map = $('.cols.b-select-city');
    if (map.length < 1) {
        // попытаемся найти объявления
        if (findAd()) {
            addButtons();
            findIDInBase ()
        }
    }
    else {

    }
};

function findIDInBase () {
    chrome.storage.local.get('EAStorage', function (result) {
        let id = result.EAStorage.id;
        let arrId = result.EAStorage.arrID;
        idArr.forEach(function (item) {
            if (item in id) {
                if (id[item].block === true) {
                    blockedMess.push(item);
                }
            }
            if (arrId.indexOf(item) === -1) {
                arrId.push(item);
                newID.push(item);
            }
        });
        writeNewIdInBD(arrId);
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
        $(`#${item}`).addClass("EANewMess");
    })
}

function hideBlockedMess(arr) {
    arr.forEach(function (item) {
        let mainElem = $(`#${item}`);
        mainElem.addClass("EABlockedMess EAHiddenMess");
        $('.EAButton.EAClose', mainElem).text(boxWithOk);
    })
}

function findAd() {
    catalog = $(".catalog.catalog_table");
    ads = $(".item.item_table");
    let result;

    if (ads.length > 0) {

        result = true;

        ads.each(function (index, item) {
            idArr.push(item.id);
        });

    }
    else result = false;

    return result;
}

/**
 * Добавляет кнопки и меню на страницу.
 */
function addButtons() {
    // кнопки в объявлениях
    ads.prepend(buttonClose);
    // меню
    menu.append(buttonStartMonitoring).append(buttonShowHidden).append(buttonArrows);
    $('body').append(menu);
}

/**
 * Обрабатываем нажатие кнопок "спрятать" и "показать"
 * @param event
 */
function buttonCloseHandler(event) {
    event.stopPropagation();
    if ($(event.currentTarget).text() === boxWithOk) {
        $(event.currentTarget).text(boxWithX);
        $(event.currentTarget.parentElement).removeClass("EABlockedMess EAHiddenMess");
        toggleBlockMess(event.currentTarget.parentElement, false)
    }
    else {
        $(event.currentTarget.parentElement).addClass("EABlockedMess EAHiddenMess");
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

function buttonArrowsHandler() {

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
    chromeStorage.get("EAStorage", function (result) {
        if (result.EAStorage === undefined) {
            chromeStorage.set({
                'EAStorage': {
                    'settings': {
                        'mode': 'nonMonitoring'
                    },
                    "arrID": [],
                    'id': {}
                }
            });
        }
    })
}