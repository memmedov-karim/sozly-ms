import {Request, Response, NextFunction} from "express";
import {generateUserId} from "../../services/client/AuthService";


export class ClientAuthController {
    async generateClientUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = generateUserId();
            res.status(200).json({success:true, userId});
        } catch (error) {
            next(error);
        }
    }
}

export default new ClientAuthController();