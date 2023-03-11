import $ from 'jquery';
import Extension_storage from './Storage';
import _ from 'lodash';

let svg_buttonX = $('<svg data-prefix="far" data-icon="times-circle" viewBox="0 0 512 512" height="30" width="30" xmlns="http://www.w3.org/2000/svg"> <path d="M256 456c-113.4937 0-200-92.0317-200-200S143.307 56 256 56s200 92.5055 200 200-86.5063 200-200 200z" class="in-circle" fill="none" stroke-width=".6321"/> <path fill="green" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm101.8-262.2L295.6 256l62.2 62.2c4.7 4.7 4.7 12.3 0 17l-22.6 22.6c-4.7 4.7-12.3 4.7-17 0L256 295.6l-62.2 62.2c-4.7 4.7-12.3 4.7-17 0l-22.6-22.6c-4.7-4.7-4.7-12.3 0-17l62.2-62.2-62.2-62.2c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0l62.2 62.2 62.2-62.2c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17z" class="out-circle"/></svg>')
	.hover(function () {
		$('.in-circle', this).addClass('red');
	},
	function () {
		$('.in-circle', this).removeClass('red');
	});

let svg_buttonOK = $('<svg xmlns="http://www.w3.org/2000/svg" class=".ok-button"\n' +
    '     data-icon="times-circle" data-prefix="far" viewBox="0 0 512 512" width="30" height="30">\n' +
    '    <path class="in-circle" fill="none" stroke-width=".6" d="M270 456a200 200 0 11-1-399 200 200 0 011 399z"/>\n' +
    '    <g fill="red">\n' +
    '        <path \n' +
    '              d="M253 258c0 67-34 101-93 102-70 0-89-43-89-99 0-65 35-100 93-101 68 0 89 43 89 98zm-41 2c2-33-11-69-49-67-34 1-51 21-51 66 0 42 12 70 50 68 33 0 49-22 50-67z"\n' +
    '              color="#000" />\n' +
    '        <path \n' +
    '              d="M406 357c-10 0-19 1-23-6l-58-92v92c0 6-13 6-19 6-11 0-20-1-20-6V169c0-3 3-6 20-6 16 0 19 3 19 6v82l56-81c4-8 13-7 22-7 21 1 26 3 14 20l-53 69 58 87c10 16 3 18-16 18z"\n' +
    '              />\n' +
    '    </g>\n' +
    '    <path class="out-circle" fill="red"\n' +
    '          d="M256 8a248 248 0 100 496 248 248 0 000-496zm0 448a200 200 0 110-400 200 200 0 010 400z"/>\n' +
    '</svg>')
	.hover(function () {
		$('.in-circle', this).addClass('green');
	},
	function () {
		$('.in-circle', this).removeClass('green');
	});

let mode,
	newID = [],
	blockedMess = [],
	timerID,
	storage,
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
	buttonClose = $('<span></span>').append($(svg_buttonX).clone(true));
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
	class_newMess     = 'olx_EANewMess';
	class_hiddenMess  = 'olx_EAHiddenMess';
	class_blockedMess = 'olx_EABlockedMess';
	class_hiddenAndBlockedMess = 'olx_EABlockedMess olx_EAHiddenMess';
	selector_buttonClose = '.olx_EAButton.olx_EAClose';
	selector_newMess     = '.olx_EANewMess';
	selector_hiddenMess  = '.olx_EAHiddenMess';
	selector_blockedMess = '.olx_EABlockedMess';

	buttonsInit();
	buttonClose.addClass(class_buttonClose).on('click', olx_buttonCloseOrOkHandler);
	buttonShowHidden.on('click', olx_buttonShowHiddenHandler);

}

function avito_setButtonsSettings() {

	class_buttonClose = 'avt_EAButton avt_EAClose';
	class_newMess     = 'avt_EANewMess';
	class_hiddenMess  = 'avt_EAHiddenMess';
	class_blockedMess = 'avt_EABlockedMess';
	class_hiddenAndBlockedMess = 'avt_EABlockedMess avt_EAHiddenMess';
	selector_buttonClose = '.avt_EAButton.avt_EAClose';
	selector_newMess     = '.avt_EANewMess';
	selector_hiddenMess  = '.avt_EAHiddenMess';
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

	mutationObserverOlx();

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

	mutationObserverAvito();

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

function olx_hideBlockedMess(arr) {

	_(arr).each(function (id) {

		let wrapElement = getOlxWrapElementByDataId(id);
		let mainElem = getOlxMainElementByWrapElement(wrapElement);
		let olxButton = $(selector_buttonClose, mainElem);

		$(mainElem).addClass(class_blockedMess);
		$(wrapElement).addClass(class_hiddenMess);
		olxButton.find('svg').remove('svg');
		olxButton.append($(svg_buttonOK).clone(true));

	});

}

function avito_hideBlockedMess(arr_id_blockedMess) {
	arr_id_blockedMess.forEach(function (item) {
		let mainElem = $(`[id="${item}"]`);
		mainElem.addClass(class_hiddenAndBlockedMess);
		$(selector_buttonClose, mainElem).find('svg').remove('svg').end().append($(svg_buttonOK).clone(true));
	});
}

/**
 * Добавляет кнопки и меню на страницу.
 */
function addButtons(listAds) {

	// кнопки в объявлениях
	listAds.each(function (i, e) {
		$(e).prepend($(buttonClose).clone(true));
	});

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

	let id = event.currentTarget.parentElement.id;
	let mainElement = $(`[id=${id}]`);

	if (mainElement.hasClass(class_blockedMess)) {

		mainElement.removeClass(class_hiddenAndBlockedMess);
		mainElement.find(selector_buttonClose).find('svg').remove('svg').end().append($(svg_buttonX).clone(true));
		await avito_toggleBlockMessInDB(event.currentTarget.parentElement, false);

	}
	else {

		mainElement.addClass(class_hiddenAndBlockedMess);
		mainElement.find(selector_buttonClose).find('svg').remove('svg').end().append($(svg_buttonOK).clone(true));
		await avito_toggleBlockMessInDB(event.currentTarget.parentElement, true);

	}

}

let removeClass = (element, cl) => $(element).removeClass(cl);
let addClass = (element, cl) => $(element).addClass(cl);
let getElementFromEvent = (event) => _.property('currentTarget')(event);

/**
 * Обрабатываем нажатие кнопок "спрятать" и "показать"
 * @param event
 */
async function olx_buttonCloseOrOkHandler(event) {

	event.stopPropagation();

	let buttonElement = $(getElementFromEvent(event));
	let id = $(buttonElement).closest('.wrap .offer-wrapper>table').attr('data-id');
	let mainElement = $(`.wrap [data-id=${id}]`);
	let wrapElement = $(mainElement).closest('.wrap');
	buttonElement = $('.olx_EAButton.olx_EAClose', wrapElement);

	let setElementUnhidden = _.flow([
		() => buttonElement.find('svg').remove('svg'),
		() => (buttonElement.append($(svg_buttonX).clone(true))),
		_.partial(removeClass, wrapElement, class_hiddenMess),
		_.partial(removeClass, mainElement, class_blockedMess),
		_.partial(olx_toggleBlockMessInDB, id, false)
	]);

	let setElementHidden = _.flow([
		_.partial(addClass, wrapElement, class_hiddenMess),
		_.partial(addClass, mainElement, class_blockedMess),
		() => buttonElement.find('svg').remove('svg'),
		() => buttonElement.append($(svg_buttonOK).clone(true)),
		_.partial(olx_toggleBlockMessInDB, id, true)
	]);

	if ($(mainElement).hasClass(class_blockedMess)) {
		setElementUnhidden();
	}
	else {
		setElementHidden();
	}

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

function mutationObserverOlx() {

	let mutationObserver = new MutationObserver(function () {

		//DOMMutationDetected = true;
		mutationObserver.disconnect();
		newID = [];
		blockedMess = [];

		setTimeout(function () {
			start().finally();
		}, 2000);

	});

	let el = document.querySelector('#listContainer');
	
	if (el) {
		mutationObserver.observe(el, {childList: true});
	}

}

function mutationObserverAvito() {

	let mutationObserver = new MutationObserver(function (/* mutRec, mutObs */) {

		mutationObserver.disconnect();
		newID = [];
		blockedMess = [];

		setTimeout(function () {
			start().finally();
		}, 2000);

	});

	//let el = $('[data-marker="catalog-serp"] [data-marker="item"]')[0].parentElement
	let el = document.querySelector('body');

	if (el) {
		mutationObserver.observe(el, {
			childList: true,
			attributes: true,
			subtree: true
		});
	}

}