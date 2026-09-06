/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчёт прибыли от операции
   const { discount, sale_price, quantity } = purchase;

    const discountDecimal = discount / 100;
    const totalPrice = sale_price * quantity;
    const revenue = totalPrice * (1 - discountDecimal);
    return revenue;
}

function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчёт бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

function analyzeSalesData(data, options) {


    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
        || data.products.length === 0
        || !Array.isArray(data.purchase_records)
        || data.purchase_records.length === 0
    )
    {throw new Error('Некорректные входные данные');}

    // @TODO: Проверка наличия опций
    if (!options || typeof options !== "object") 
        {throw new Error('Некорректные опции');}

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== "function"
        || typeof calculateBonus !== "function")
        {throw new Error('Чего-то не хватает');}
    // @TODO: Подготовка промежуточных данных для сбора статистики

   // Заполним начальными данными

    const sellerStats = data.sellers.map((seller) => {
    return {
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    };
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(stat => [stat.id, stat]));
    const productIndex = Object.fromEntries(
  data.products.map(product => [product.sku, product])
);
    // @TODO: Расчёт выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        
        // Увеличить количество продаж 
        seller.sales_count += 1;
        
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product);
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;
        // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;  
        });
 }); 





    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
    
    const productsSold = Object.entries(seller.products_sold);
    const products = productsSold.map(([sku, quantity]) => ({
    sku,
    quantity
}));
    products.sort((a, b) => b.quantity - a.quantity);
    seller.top_products = products.slice(0, 10);
});
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
}));
}