import db from '../config/db.js';

class ShoppingList {
    /**
     * Öğün planına göre alışveriş listesi oluşturur.
     * Kilerdeki mevcut ürünleri toplam miktardan çıkarır.
     */
    static async generateFromMealPlan(userId, startDate, endDate) {
        // 'db.pool.connect()' kullanarak transaction başlatıyoruz
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Mevcut öğün planı kaynaklı alışveriş listesi kalemlerini temizle
            await client.query(
                'DELETE FROM shopping_list_items WHERE user_id = $1 AND from_meal_plan = true',
                [userId]
            );

            // 2. Öğün planındaki tariflerden gerekli tüm malzemeleri ve miktarlarını al
            // SUM() sonucu string dönebilir, bu yüzden CAST veya parseFloat gerekir
            const recipeResult = await client.query(
                `SELECT 
                    LOWER(ri.ingredient_name) as name, 
                    ri.unit, 
                    SUM(ri.quantity)::FLOAT as total_quantity
                FROM meal_plans mp
                JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id
                WHERE mp.user_id = $1
                AND mp.meal_date BETWEEN $2 AND $3
                GROUP BY LOWER(ri.ingredient_name), ri.unit`,
                [userId, startDate, endDate]
            );

            const neededIngredients = recipeResult.rows;

            // 3. Kilerdeki (pantry) mevcut ürünleri al
            const pantryResult = await client.query(
                'SELECT LOWER(name) as name, quantity, unit FROM pantry_items WHERE user_id = $1',
                [userId]
            );

            // Kilerdeki ürünleri hızlı erişim için bir Map'e koyalım
            const pantryMap = new Map();
            pantryResult.rows.forEach(item => {
                const key = `${item.name}_${item.unit}`;
                pantryMap.set(key, parseFloat(item.quantity) || 0);
            });

            // 4. Karşılaştırma ve Kaydetme
            for (const ing of neededIngredients) {
                const key = `${ing.name}_${ing.unit}`;
                const inPantry = pantryMap.get(key) || 0;
                const finalNeeded = Math.max(0, ing.total_quantity - inPantry);

                // Eğer kilerde yeterli yoksa alışveriş listesine ekle
                if (finalNeeded > 0) {
                    await client.query(
                        `INSERT INTO shopping_list_items 
                        (user_id, ingredient_name, quantity, unit, from_meal_plan, category)
                        VALUES ($1, $2, $3, $4, true, $5)`,
                        [userId, ing.name, finalNeeded, ing.unit, 'General']
                    );
                }
            }

            await client.query('COMMIT');
            return { success: true, message: 'Shopping list generated successfully' };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error generating shopping list:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    //add manual item to list

    static async create(userId, itemData){
        const {ingredient_name,quantity, unit, category = 'Uncategorized'} = itemData;

        const result = await db.query(
            `INSERT INTO shopping_list_items(user_id, ingredient_name, quantity, unit, category, from_meal_plan) VALUES ($1,$2,$3,$4,$5,false) RETURNING *`,[userId, ingredient_name, quantity, unit, category]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await db.query(
            'SELECT * FROM shopping_list_items WHERE user_id = $1 ORDER BY category, ingredient_name',
            [userId]
        );
        return result.rows;
    }

    static async getGroupedByCategory(userId) {
        const result = await db.query(
            `SELECT category, json_agg(
                json_build_object(
                    'id', id,
                    'ingredient_name', ingredient_name,
                    'quantity', quantity,
                    'unit', unit,
                    'is_checked', is_checked,
                    'from_meal_plan', from_meal_plan
                )
            ) as items
            FROM shopping_list_items
            WHERE user_id = $1
            GROUP BY category
            ORDER BY category`,
            [userId]
        );

        return result.rows;
    }

    //update shoping list
    static async update(id, userId, updates) {
        const { ingredient_name, quantity, unit, category, is_checked } = updates;

        const result = await db.query(
            `UPDATE shopping_list_items
        SET ingredient_name = COALESCE($1, ingredient_name),
        quantity = COALESCE($2, quantity),
        unit = COALESCE($3, unit),
        category = COALESCE($4, category),
        is_checked = COALESCE($5, is_checked)
        WHERE id = $6 AND user_id = $7
        RETURNING *`,
            [ingredient_name, quantity, unit, category, is_checked, id, userId]
        );

        return result.rows[0];
    }

    //toggle item checked

    static async toggleChecked(id,userId){
        const result = await db.query(
            `UPDATE shopping_list_items SET is_checked = NOT is_checked WHERE id = $1 AND user_id = $2 RETURNING *`,[id, userId]
        );
        return result.rows[0];
    }

    //delete items in shopping list

    static async delete(id,userId){
        const result = await db.query(
            `DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    //clear all checked items

    static async clearChecked(userId){
        const result = await db.query(
            `DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true RETURNING *`,[userId]
        );
        return result.cows;
    }

    //clear all list

    static async clearAll(userId){
        const result = await db.query(`DELETE FROM shopping_list_items WHERE user_id = $1 RETURNING *`,[userId]
        );
        return result.rows;
    }

    //Add checked items to pantry

    static async addCheckedToPantry(userId) {
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        //get checked items
        const checkedItems = await client.query(
            'SELECT * FROM shopping_list_items WHERE user_id = $1 AND is_checked = true',
            [userId]
        );

        //add to pantry
        for (const item of checkedItems.rows) {
            await client.query(
                `INSERT INTO pantry_items (user_id, name, quantity, unit, category)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, item.ingredient_name, item.quantity, item.unit, item.category]
            );
        }

        //delete items from list
        await client.query(
            'DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true',
            [userId]
        );

        await client.query('COMMIT');
        return checkedItems.rows;
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

}

export default ShoppingList;