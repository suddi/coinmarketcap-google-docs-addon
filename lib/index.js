'use strict';

/* eslint no-undef:off */

function safeJsonParse(body) {
    try {
        return JSON.parse(body);
    } catch (error) {
        return {};
    }
}

function getCurrentPrices() {
    const url = 'https://api.coinmarketcap.com/v1/ticker/?limit=2000';
    const response = UrlFetchApp.fetch(url);
    const responseBody = response.getContentText();
    return safeJsonParse(responseBody);
}

function getLastUpdated(lastUpdated) {
    if (lastUpdated) {
        return new Date(parseInt(lastUpdated, 10) * 1000).toISOString();
    }
    return '';
}

function formatPrice(price) {
    return [
        price.name,
        price.symbol,
        price.price_usd,
        price.price_btc,
        price.percent_change_1h,
        price.percent_change_24h,
        price.percent_change_7d,
        price.rank,
        price['24h_volume_usd'],
        price.market_cap_usd,
        price.available_supply,
        getLastUpdated(price.last_updated)
    ];
}

function createHeaders(sheet, headerRows, headerColumns) {
    // Merge "Currency" horizontally
    sheet
        .getRange('A1:B1')
        .mergeAcross();

    // Merge "Price" horizontally
    sheet
        .getRange('C1:D1')
        .mergeAcross();

    // Merge "Change" horizontally
    sheet
        .getRange('E1:G1')
        .mergeAcross();

    // Merge "Market" horizontally
    sheet
        .getRange('H1:K1')
        .mergeAcross();

    // Freeze the first 2 rows
    sheet
        .setFrozenRows(2);

    // Freeze the first 2 columns
    sheet
        .setFrozenColumns(2);

    const range = sheet
        .getRange(1, 1, headerRows, headerColumns);

    const values = [
        ['Currency', '', 'Price', '', 'Change', '', '', 'Market', '', '', '', 'Updated'],
        ['Name', 'Code', 'USD', 'BTC', '1H', '24H', '7D', 'Rank', '24H Volume', 'Market Cap', 'Circulating Supply', '']
    ];

    return range
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setValues(values);
}

function updatePrices(sheetName, options) {
    const sheet = SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(sheetName);
    createHeaders(sheet, options.headerRows, options.headerColumns);

    const prices = getCurrentPrices();
    const values = prices.map(function (price) {
        return formatPrice(price);
    });

    const eightDecimalPlacesFormat = '#,##0.00000000';
    const twoDecimalPlacesFormat = '#,##0.00';
    const numberFormat = [
        undefined,
        undefined,
        eightDecimalPlacesFormat,
        eightDecimalPlacesFormat,
        twoDecimalPlacesFormat,
        twoDecimalPlacesFormat,
        twoDecimalPlacesFormat,
        undefined,
        twoDecimalPlacesFormat,
        twoDecimalPlacesFormat,
        twoDecimalPlacesFormat,
        undefined
    ];
    const numberFormats = values.map(function () {
        return numberFormat;
    });

    const startRow = 1 + options.headerRows;
    sheet
        .getRange(startRow, 1, values.length, 2)
        .clearFormat()
        .setHorizontalAlignment('left');

    sheet
        .getRange(startRow, 1, values.length, options.headerColumns)
        .setNumberFormats(numberFormats)
        .setValues(values);

    return values[0].map(function (_, index) {
        return sheet
            .autoResizeColumn(index + 1);
    });
}

function runScript() {
    // Config
    const sheetName = 'CoinMarketCap';
    const options = {
        headerRows: 2,
        headerColumns: 12
    };

    return updatePrices(sheetName, options);
}

runScript();
