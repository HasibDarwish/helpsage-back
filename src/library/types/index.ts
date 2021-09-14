import { Response, NextFunction} from "express";


export interface RequestType {
	(req: any, res: Response, next: NextFunction): void;
}
