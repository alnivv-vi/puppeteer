const puppeteer = require('puppeteer');
const assert = require("assert");

(async function () {
    // Запускаем браузер, устанавливаем максимальное разрешение
    const browser = await puppeteer.launch({
        headless: false, args: [
            '--window-size=1920,1080',
        ],
    });
    await browser.pages();
    // Открываем новую страницу в браузере
    const page = await browser.newPage();
    // для замеров времени прохождения теста
    let start = Date.now();
    await page.setViewport({width: 1920, height: 1080})

    // Заходим на сайт
    await page.goto('https://www.vseinstrumenti.ru/represent/change/?represent_id=1&represent_type=common&url_to_redirect=https://www.vseinstrumenti.ru/&regionAutocomplete=');
    // Переход на страницу регистрации
    await page.goto('https://www.vseinstrumenti.ru/pcabinet/registration/');
    // Выбор вкладки email
    await page.waitForSelector('[data-tab-name="email"]');
    await page.click('[data-tab-name="email"]');
    // Ввод логина
    await page.waitForSelector('#login-email');
    await page.type('#login-email', 'vseins_site_day683@mail.ru');
    // Ввод пароля
    await page.waitForSelector('#login-password');
    await page.type('#login-password', '111111');
    // Логинимся
    await page.waitForSelector('#login-btn');
    await page.click('#login-btn');
    await page.waitForSelector('#login-btn', {hidden: true});
    // Очистка корзины
    await page.goto('https://www.vseinstrumenti.ru/run/PCabinet/MyCart/clearCart');
    // Переход в листинг
    await page.goto('https://www.vseinstrumenti.ru/instrument/shurupoverty/akkumulyatornye-dreli/');
    // Клик на первую кнопку "В корзину"
    await page.waitForSelector('[data-behavior="add-to-cart"]');
    await page.click('[data-behavior="add-to-cart"]');
    // Переход в корзину
    await page.waitForSelector('[data-behavior="go-to-cart"]');
    await page.click('[data-behavior="go-to-cart"]');
    // Получаем стоимость товара в корзине
    const priceLoc = await page.waitForSelector('[data-qa="cart-total-sum-value"] span');
    let priceRaw = await priceLoc.evaluate(el => el.textContent);
    let price = priceRaw.replace(/\D/g, '');
    // Кликаем на "Изменить данные" (Данные предыдущего заказа запомнены)
    await page.waitForSelector('[data-qa="cart-total-change-data-button"]');
    await page.click('[data-qa="cart-total-change-data-button"]');
    // Выбираем Самовывоз
    await page.waitForSelector('[data-qa="ordering-delivery-type-self"]');
    await page.click('[data-qa="ordering-delivery-type-self"]');
    // Ожидаем карту
    await page.waitForSelector('.ymap-container');
    // waitForText заголовка
    await page.waitForFunction(
        'document.querySelector(".main-container h1").innerText.includes("Оформление заказа")'
    );
    await page.waitForSelector('.scrollbar-content');
    // Получение адреса ПВЗ на одностраничнике
    const pvzNameLoc = await page.waitForSelector('[data-qa="order-point-info"][data-is-active="true"] [data-qa="order-point-address"]');
    let pvzNameRaw = await pvzNameLoc.evaluate(el => el.textContent);
    let pvzName = pvzNameRaw.trim();
    // Получение суммы заказа на одностраничнике
    const totalSumLoc = await page.waitForSelector('[data-qa="checkout-total-total-price"]');
    let totalSumRaw = await totalSumLoc.evaluate(el => el.textContent);
    let totalSum = totalSumRaw.replace(/\D/g, '');
    // Получение адреса в блоке ИТОГО
    const deliveryAddressLoc = await page.waitForSelector('[data-qa="checkout-total-delivery"] span');
    let deliveryAddress = await deliveryAddressLoc.evaluate(el => el.textContent);
    // Ассерты
    assert.strictEqual(price, totalSum, 'Сумма заказа не равна в корзине и в заказе');
    assert.strictEqual(pvzName, deliveryAddress, 'Активный ПВЗ неверно подставился в блоке ИТОГО');
    //Выбор спопоба оплаты Наличными
    await page.waitForSelector('[data-qa="ordering-payment-type-cash"]');
    await page.click('[data-qa="ordering-payment-type-cash"]');
    //Проверка отображения выбранного способа оплаты в блоке ИТОГО
    await page.waitForFunction(
        'document.querySelector("[data-qa=\'checkout-total-payment\'] span").innerText.includes("Наличными")'
    );
    //Проверка отображения ФИО покупателя
    await page.waitForFunction(
        'document.querySelector("[data-qa=\'checkout-contractor-select\']").innerText.includes("Тест Тестов")'
    );
    //Проверка отображения номера телефона покупателя (Не работает)
    // await page.waitForFunction(
    //     'document.querySelector("[data-qa=\'checkout-contractor-phone\'] input").innerText.includes("+7 (495) 000-00-00")'
    // );
    //Проверка отображения номера телефона покупателя (Не работает)
    //Подтвеждение заказа
    await page.waitForSelector('[data-qa="ordering-total-order-create-button"]');
    await page.click('[data-qa="ordering-total-order-create-button"]');
    //Получение номера заказа на ThankYouPage
    const orderNumberLoc = await page.waitForSelector('[data-qa="thanks-page-order-number"]');
    let orderNumberRaw = await orderNumberLoc.evaluate(el => el.textContent);
    let orderNumber = (orderNumberRaw.replace(/(\r\n|\n|\r)/gm, '')).trim();
    // Получение данных с текущей датой
    let date = new Date;
    let month = "0" + (date.getMonth() + 1);
    let fullYear = date.getFullYear();
    let year = fullYear.toString().slice(-2);
    // Составление шаблона номера заказа (ругулярки) с актуальным месяцем и годом
    let pattern = '№' + year + month + '-' + '2' + '[0-9]{5}-[0-9]{5}';
    // Поиск совпадений
    let matches = await orderNumber.match(pattern)
    assert.strictEqual(matches.length, 1, 'Номер заказа не совпадает с ожидаемым шаблоном')
    // Проверка отображения кнопки онлайн-оплаты
    await page.waitForSelector('[data-qa="thanks-page-pay-online"]');
    // Клик на ссылку с номером заказа с последующим редиректом в ЛК
    await page.waitForSelector('[data-qa="thanks-page-order-number"]');
    await page.click('[data-qa="thanks-page-order-number"]');

    // Создание объекта страницы в появившейся после редиректа вкладке
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
    const newPage = await newPagePromise;
    await newPage.setViewport({width: 1920, height: 1080})
    // Проверка отображения номера созданного заказа в ЛК
    const orderNumberInLKLoc = await newPage.waitForSelector('[data-qa="order-card"]:nth-child(1) [data-qa="number"]');
    let orderNumberInLK = await orderNumberInLKLoc.evaluate(el => el.textContent);
    assert.notStrictEqual(orderNumberInLK, '0000-000000-00000', 'Номер заказа не сформировался');
    // Проверка наличия id соданного заказа в ЛК
    await newPage.waitForSelector('[data-qa="order-card"]:nth-child(1)');
    let orderIdInLK = await newPage.evaluate(() => document.querySelector('[data-qa="order-card"]:nth-child(1)').getAttribute("data-order-id"));
    assert.notStrictEqual(orderIdInLK, '', 'id заказа не сформировался');
    // Проверка отображения статуса созданного заказа в ЛК
    const orderStatusInLKLoc = await newPage.waitForSelector('[data-qa="order-card"]:nth-child(1) [data-qa="status"]');
    let orderStatusInLKRaw = await orderStatusInLKLoc.evaluate(el => el.textContent);
    let orderStatusInLk = orderStatusInLKRaw.trim();
    assert.strictEqual(orderStatusInLk, 'В обработке', 'Статус заказа отличен от "В обработке');
    // Проверка отображения ПВЗ для созданного заказа в ЛК
    const pvzInfoLoc = await newPage.waitForSelector('[data-qa="order-card"]:nth-child(1) [data-qa="delivery-address"]');
    let pvzInfoInLKRaw = await pvzInfoLoc.evaluate(el => el.textContent);
    let pvzInfoInLK = pvzInfoInLKRaw.trim();
    let expectedPvzFromOrder = "Самовывоз из офиса: " + pvzName + "";
    let isPvzNameSame = expectedPvzFromOrder.includes(pvzInfoInLK);
    assert.strictEqual(isPvzNameSame, true, 'В ЛК не отображается выбранный в заказе ПВЗ');
    // Закрытие страницы с ЛК
    await newPage.close();

    // Проверка отображения суммы заказа на ThankYouPage в блоке ИТОГО
    const sumBlockLocOnTYP = await page.waitForSelector('[data-qa="thanks-total-price"]');
    let sumRaw = await sumBlockLocOnTYP.evaluate(el => el.textContent);
    let sumOnTYP = sumRaw.replace(/\D/g, '');
    assert.strictEqual(sumOnTYP, price, 'Сумма заказа в блоке ИТОГО на TYP и на Одностраничнике не равна');
    // Проверка отображения суммы заказа на ThankYouPage в строке после "Спасибо за заказ"
    const sumStringLocOnTYP = await page.waitForSelector('[data-qa="thanks-page-price"]');
    let sumStringRaw = await sumStringLocOnTYP.evaluate(el => el.textContent);
    let sumStringOnTYP = sumStringRaw.replace(/\D/g, '');
    assert.strictEqual(sumStringOnTYP, price, 'Сумма заказа в строке на TYP и на Одностраничнике не равна');
    // Закрытие браузера
    await browser.close();
    // Расчёт времени прохождения теста
    let end = Date.now();
    console.log(`Тест отработал за ${end - start} миллисекунд`);
})();
