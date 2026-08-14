UPDATE `products`
SET `brand` = 'Marca por confirmar',
    `updated_at` = CURRENT_TIMESTAMP
WHERE `brand` = 'Marca propia Amapola';
