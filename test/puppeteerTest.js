import chai from 'chai';
import crypto from 'crypto';
import {PuppeteerJQuery} from "../../lib/PuppeteerJQuery";
import {Puppeteer$} from "../../lib/Puppeteer$";
import {PuppeteerElement} from "../../lib/PuppeteerElement";
import {PuppeteerUtils} from "../../lib/PuppeteerUtils"
const puppeteer = require('puppeteer');
const pathToExtension = require('path').join(__dirname, '../development');
let browser
let page
let pptrJQ
let pptrUtils

chai.should()

describe('Avito главная', function () {

    it('puppeteer start', async function () {

        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
                '--window-size=1500,1010'
            ],
        })

    })

    it('puppeteer new page', async function () {

        page = await browser.newPage()
        await page.setViewport({width: 1500, height: 1000});
        pptrUtils = new PuppeteerUtils(page)

    })

    it('go to avito.ru, Личные вещи', async function () {

        this.timeout(15000);
        //await page.goto('https://www.avito.ru/rossiya/vakansii/tag/kladovschik', {waitUntil: 'domcontentloaded' })
        await pptrUtils.goto('https://www.avito.ru/rossiya/vakansii/tag/kladovschik')

    })

    it('PuppeteerJQuery inject', async function () {

        this.timeout(15000)

        pptrJQ = await new PuppeteerJQuery(page);
        pptrJQ.injected.should.be.eq(true)

        //await page.goto('https://www.avito.ru/rossiya/lichnye_veschi', {waitUntil: 'domcontentloaded' })
        await pptrUtils.goto('https://www.avito.ru/rossiya/lichnye_veschi')
        await pptrJQ.injectJQuery()
        pptrJQ.injected.should.be.eq(true)

    })

    it('Личные вещи. Находит объявления "[data-marker=item]"', async function () {

        let ppEl = new PuppeteerElement(page, '[data-marker="item"]');
        (await ppEl.find()).exists().should.eq(true);
        ppEl.count().should.greaterThan(10)

    })

    it('Все найденные объявления содержат id вида "i+цифры"', async function () {

        let item = await new Puppeteer$('[data-marker=item]', pptrJQ)

        let filtered = await item.filter((handle) => {

            function f (index, element) {
                let re = /^i\d+$/igm
                return re.test(element.id)
            }

            return handle.filter(f)

        });

        (await filtered.length()).should.greaterThan(30)

    })

    it('Родительский элемент [data-marker="catalog-serp"]', async function (){
        (await
            (await new Puppeteer$('[data-marker="catalog-serp"]', pptrJQ))
                .length()).should.eq(1)
    })

    it('Родительский элемент VIP объявлений [class*="items-vip-"]', async function (){
        (await
            (await new Puppeteer$('[class*="items-vip-"]', pptrJQ))
                .length()).should.greaterThan(0)
    })

    it('VIP объявления  [class*="items-vip-"] [data-marker="item"]', async function () {
        (await
            (await new Puppeteer$('[class*="items-vip-"] [data-marker="item"]', pptrJQ))
                .length()).should.greaterThan(0)
    })

    it('witcher объявления  [class*="items-witcher-"] [data-marker="item"]', async function () {
        (await
            (await new Puppeteer$('[class*="items-witcher-"] [data-marker="item"]', pptrJQ))
                .length()).should.greaterThan(0)
    })

    describe('Личные вещи. Находит объявления ".item.item_table"', function () {

        before(async function () {

            let ppEl = new PuppeteerElement(page, '.item.item_table');

            if (!(await ppEl.find()).exists()) {
                this.skip()
            }

        });

        it('.item.item_table', async function () {

            let ppEl = new PuppeteerElement(page, '.item.item_table');
            (await ppEl.find()).exists().should.eq(true);
            ppEl.count().should.greaterThan(10)

        })

    })

    describe('Личные вещи. Находит объявления ".snippet-list > [data-marker=item]"', function () {

        before(async function () {

            let ppEl = new PuppeteerElement(page, '.snippet-list > [data-marker=item]');

            if (!(await ppEl.find()).exists()) {
                this.skip()
            }

        });

        it('snippet-list > [data-marker=item]', async function () {

            let ppEl = new PuppeteerElement(page, '.snippet-list > [data-marker=item]');
            (await ppEl.find()).exists().should.eq(true);
            ppEl.count().should.greaterThan(10)

        })

    })

    describe('Родительский элемент VIP объявлений .serp-vips', function () {

        before(async function () {

            let result = await
                (await new Puppeteer$('.serp-vips', pptrJQ))
                    .length() > 0

            if (!result) {
                this.skip()
            }

        });

        it('.serp-vips', async function (){
            (await
                (await new Puppeteer$('.serp-vips', pptrJQ))
                    .length()).should.greaterThan(1)
        })

    })

    describe('VIP объявления .serp-vips [data-marker=item]', function () {

        before(async function () {

            let result =  (await
                (await new Puppeteer$('.serp-vips [data-marker=item]', pptrJQ))
                    .length()) > 0

            if (!result) {
                this.skip()
            }

        });

        it('.serp-vips [data-marker=item]', async function () {
            (await
                (await new Puppeteer$('.serp-vips [data-marker=item]', pptrJQ))
                    .length()).should.greaterThan(1)
        })
    })

})

describe('Разное', function () {

    it('crypto должен выводить уникальный id', function () {
        let id = crypto.randomBytes(3).toString('hex');
        id.length.should.eq(6);
        id.should.be.a('string');
    })

})