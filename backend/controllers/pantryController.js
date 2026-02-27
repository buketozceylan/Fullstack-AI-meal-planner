import PantryItem from '../models/PantryItem.js';

//get all pantry items

export const getPantryItems = async (req, res, next) => {
    try{
        const {category, is_running_low, search} = req.query;
        const items = await PantryItem.findByUserId(req.user.id,{
            category,
            is_running_low: is_running_low === 'true' ? true : undefined,
            search
        });
        res.json({
            success: true,
            data: { items }
        });
    
    }catch (error){
        next(error);
    }
};

//get pantry stat

export const getPantryStats = async(req,res,next) => {
    try{
        const stats = await PantryItem.getStats(req.user.id);

        res.json({
            success:true,
            data: {stats}
        });
    } catch (error){
        next(error);
    }
};

//get items expiring soon

export const getExpiringSoon = async (req, res, next) => {
    try{
        const days = parseInt(req.query.days) || 7;
        const items = await PantryItem.getExpiringSoon(req.user.id, days);
        res.json({
            success: true,
            data: {items}
        });
    } catch (error){
        next(error);
    }
};

//add pantry item

export const addPantryItem = async (req,res,next) => {
    try{
        const item = await PantryItem.create(req.user.id, req.body);

        res.status(201).json({
            success: true,
            message: 'Item added to Pantry',
            data: {item}
        });
    } catch (error){
        next(error);
    }
};

//update pantry item

export const updatePantryItem = async (req,res,next) => {
    try{
        const {id} = req.params;
        const item =await PantryItem.update(id,req.user.id, req.body);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Pantry item not found'
            });
        }
        res.json({
            success:true,
            message: 'Pantry item updated',
            data: {item}
        });
    } catch (error) {
        next(error);
    }
    
};


//delete pantry item

export const deletePantryItem = async (req,res,next) => {
    try{
        const {id} = req.params;
        const item = await PantryItem.delete(id, req.user.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Pantry item not found'
            });
        }

        res.json({
            success: true,
            message: 'Pantry item deleted',
            data: {item}
        });
    } catch (error) {
        next(error);
    }
}

