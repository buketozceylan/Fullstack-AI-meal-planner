import ShoppingList from '../models/ShoppingList.js';

//generate shopping list from meal plan

export const generateFromMealPlan = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide startDate and endDate'
            });
        }

        const items = await ShoppingList.generateFromMealPlan(req.user.id, startDate, endDate);

        res.json({
            success: true,
            message: 'Shopping list generated from meal plan',
            data: { items }
        });
        
    } catch (error) {
        next(error);
    }
};

//get shopping list

export const getShoppingList = async (req, res, next) => {
    try {
        const grouped = req.query.grouped === 'true';

        const items = grouped
            ? await ShoppingList.getGroupedByCategory(req.user.id)
            : await ShoppingList.findByUserId(req.user.id);

        res.json({
            success: true,
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

//add item to shoppinglist

export const addItem = async(req,res,next) => {
    try{
        const item =await ShoppingList.create(req.user.id, req.body);

        res.status(201).json({
            success: true,
            message: 'Item added to shopping list',
            data: {item}
        });
    } catch(Error){
        next(error);
    }
};

//update shopping list item

export const updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await ShoppingList.update(id, req.user.id, req.body);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Shopping list item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item updated',
            data: { item }
        });

    } catch (error) {
        next(error);
    }
};

//toggle item checked status

export const toggleChecked = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await ShoppingList.toggleChecked(id, req.user.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Shopping list item not found'
            });
        }

        res.json({
            success: true,
            data: { item }
        });
        
    } catch (error) {
        next(error);
    }
};

//delete item

export const deleteItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await ShoppingList.delete(id, req.user.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Shopping list item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item deleted',
            data: { item }
        });

    } catch (error) {
        next(error);
    }
};

//clear checked items

export const clearChecked = async (req,res,next) => {
    try{
        const items = await ShoppingList.clearChecked(req.user.id);

        res.json({
            success: true,
            message: 'Checked items cleared',
            data: {items}
        });
    } catch(error){
        next(error);
    }
};

//clear all items

export const clearAll = async (req,res,next) => {
    try{
        const items = await ShoppingList.clearAll(req.user.id);

        res.json({
            success: true,
            message: 'Checked list cleared',
            data: {items}
        });
    } catch(error){
        next(error);
    }
};

//add checked items to pantry

export const addCheckedToPantry = async (req,res,next) => {
    try{
        const items = await ShoppingList.addCheckedToPantry(req.user.id);

        res.json({
            success: true,
            message: 'Checked items add to pantry',
            data: {items}
        });
    } catch(error){
        next(error);
    }
};